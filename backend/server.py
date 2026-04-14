from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import asyncio

from audio_utils import (
    extract_waveform, detect_sections, restructure_audio,
    create_collage, export_track, ensure_dirs, UPLOAD_DIR, PROCESSED_DIR
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ensure_dirs()

app = FastAPI()
api_router = APIRouter(prefix="/api")


# Models
class SectionModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    start_time: float
    end_time: float
    energy: float = 0.0


class RestructureRequest(BaseModel):
    track_id: str
    sections: List[dict]
    name: Optional[str] = None


class CollageRequest(BaseModel):
    sections: List[dict]
    name: Optional[str] = None


class ExportRequest(BaseModel):
    track_id: Optional[str] = None
    project_id: Optional[str] = None
    format: str = "mp3"


# Endpoints
@api_router.get("/")
async def root():
    return {"message": "SoundForge API"}


@api_router.post("/tracks/upload")
async def upload_track(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.mp3', '.wav', '.ogg', '.flac', '.m4a')):
        raise HTTPException(400, "Unsupported format. Use MP3, WAV, OGG, FLAC, or M4A.")

    track_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix.lower()
    stored_filename = f"{track_id}{ext}"
    file_path = UPLOAD_DIR / stored_filename

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 50MB.")

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        loop = asyncio.get_event_loop()
        waveform_data = await loop.run_in_executor(None, extract_waveform, str(file_path))
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(400, f"Error processing audio: {str(e)}")

    track_doc = {
        'id': track_id,
        'filename': stored_filename,
        'original_name': file.filename,
        'duration': waveform_data['duration'],
        'sample_rate': waveform_data['sample_rate'],
        'waveform': waveform_data['peaks'],
        'sections': [],
        'analyzed': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }

    await db.tracks.insert_one(track_doc)
    track_doc.pop('_id', None)

    return track_doc


@api_router.get("/tracks")
async def list_tracks():
    tracks = await db.tracks.find({}, {"_id": 0}).to_list(100)
    return tracks


@api_router.get("/tracks/{track_id}")
async def get_track(track_id: str):
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track:
        raise HTTPException(404, "Track not found")
    return track


@api_router.delete("/tracks/{track_id}")
async def delete_track(track_id: str):
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track:
        raise HTTPException(404, "Track not found")

    file_path = UPLOAD_DIR / track['filename']
    file_path.unlink(missing_ok=True)

    await db.tracks.delete_one({"id": track_id})
    return {"status": "deleted"}


@api_router.post("/tracks/{track_id}/analyze")
async def analyze_track(track_id: str):
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track:
        raise HTTPException(404, "Track not found")

    file_path = UPLOAD_DIR / track['filename']
    if not file_path.exists():
        raise HTTPException(404, "Audio file not found")

    try:
        loop = asyncio.get_event_loop()
        sections = await loop.run_in_executor(None, detect_sections, str(file_path))
    except Exception as e:
        raise HTTPException(500, f"Analysis error: {str(e)}")

    await db.tracks.update_one(
        {"id": track_id},
        {"$set": {"sections": sections, "analyzed": True}}
    )

    track['sections'] = sections
    track['analyzed'] = True
    return track


@api_router.post("/restructure")
async def restructure(req: RestructureRequest):
    track = await db.tracks.find_one({"id": req.track_id}, {"_id": 0})
    if not track:
        raise HTTPException(404, "Track not found")

    file_path = UPLOAD_DIR / track['filename']
    if not file_path.exists():
        raise HTTPException(404, "Audio file not found")

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, restructure_audio, str(file_path), req.sections
        )
    except Exception as e:
        raise HTTPException(500, f"Restructure error: {str(e)}")

    project_id = str(uuid.uuid4())
    project_doc = {
        'id': project_id,
        'name': req.name or f"Restructured - {track['original_name']}",
        'type': 'restructure',
        'source_track_ids': [req.track_id],
        'output_filename': result['filename'],
        'duration': result['duration'],
        'waveform': result['waveform'],
        'created_at': datetime.now(timezone.utc).isoformat()
    }

    await db.projects.insert_one(project_doc)
    project_doc.pop('_id', None)

    return project_doc


@api_router.post("/collage")
async def create_collage_endpoint(req: CollageRequest):
    track_sections = []
    track_ids = set()

    for section in req.sections:
        track = await db.tracks.find_one({"id": section['track_id']}, {"_id": 0})
        if not track:
            raise HTTPException(404, f"Track {section['track_id']} not found")

        file_path = UPLOAD_DIR / track['filename']
        if not file_path.exists():
            raise HTTPException(404, f"Audio file not found for track {section['track_id']}")

        track_sections.append({
            'audio_path': str(file_path),
            'start_time': section['start_time'],
            'end_time': section['end_time']
        })
        track_ids.add(section['track_id'])

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, create_collage, track_sections)
    except Exception as e:
        raise HTTPException(500, f"Collage error: {str(e)}")

    project_id = str(uuid.uuid4())
    project_doc = {
        'id': project_id,
        'name': req.name or "Collage",
        'type': 'collage',
        'source_track_ids': list(track_ids),
        'output_filename': result['filename'],
        'duration': result['duration'],
        'waveform': result['waveform'],
        'created_at': datetime.now(timezone.utc).isoformat()
    }

    await db.projects.insert_one(project_doc)
    project_doc.pop('_id', None)

    return project_doc


@api_router.get("/projects")
async def list_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    return projects


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(404, "Project not found")

    file_path = PROCESSED_DIR / project['output_filename']
    file_path.unlink(missing_ok=True)

    await db.projects.delete_one({"id": project_id})
    return {"status": "deleted"}


@api_router.get("/audio/{filename}")
async def serve_audio(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        file_path = PROCESSED_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "File not found")

    media_type = "audio/mpeg"
    if filename.endswith('.wav'):
        media_type = "audio/wav"
    elif filename.endswith('.ogg'):
        media_type = "audio/ogg"
    elif filename.endswith('.flac'):
        media_type = "audio/flac"

    return FileResponse(str(file_path), media_type=media_type)


@api_router.post("/export")
async def export_audio(req: ExportRequest):
    if req.track_id:
        track = await db.tracks.find_one({"id": req.track_id}, {"_id": 0})
        if not track:
            raise HTTPException(404, "Track not found")
        audio_path = str(UPLOAD_DIR / track['filename'])
    elif req.project_id:
        project = await db.projects.find_one({"id": req.project_id}, {"_id": 0})
        if not project:
            raise HTTPException(404, "Project not found")
        audio_path = str(PROCESSED_DIR / project['output_filename'])
    else:
        raise HTTPException(400, "Provide track_id or project_id")

    if not Path(audio_path).exists():
        raise HTTPException(404, "Audio file not found")

    try:
        loop = asyncio.get_event_loop()
        output_filename = await loop.run_in_executor(None, export_track, audio_path, req.format)
    except Exception as e:
        raise HTTPException(500, f"Export error: {str(e)}")

    return {"filename": output_filename, "download_url": f"/api/audio/{output_filename}"}


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
