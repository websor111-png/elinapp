import numpy as np
from pydub import AudioSegment
import uuid
from pathlib import Path
from scipy.ndimage import uniform_filter1d

UPLOAD_DIR = Path(__file__).parent / "uploads"
PROCESSED_DIR = Path(__file__).parent / "processed"


def ensure_dirs():
    UPLOAD_DIR.mkdir(exist_ok=True)
    PROCESSED_DIR.mkdir(exist_ok=True)


def extract_waveform(audio_path: str, num_peaks: int = 1000) -> dict:
    audio = AudioSegment.from_file(audio_path)
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)

    if audio.channels == 2:
        samples = samples.reshape((-1, 2)).mean(axis=1)

    max_val = np.max(np.abs(samples)) if len(samples) > 0 else 1.0
    if max_val > 0:
        samples = samples / max_val

    chunk_size = max(1, len(samples) // num_peaks)
    peaks = []
    for i in range(0, min(len(samples), chunk_size * num_peaks), chunk_size):
        chunk = samples[i:i + chunk_size]
        peaks.append(float(np.max(np.abs(chunk))))

    peaks = peaks[:num_peaks]

    return {
        'peaks': peaks,
        'duration': len(audio) / 1000.0,
        'sample_rate': audio.frame_rate,
        'channels': audio.channels
    }


def detect_sections(audio_path: str) -> list:
    audio = AudioSegment.from_file(audio_path)
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)

    if audio.channels == 2:
        samples = samples.reshape((-1, 2)).mean(axis=1)

    sr = audio.frame_rate
    duration = len(audio) / 1000.0

    if duration < 5:
        return [{
            'id': str(uuid.uuid4()),
            'label': 'intro',
            'start_time': 0.0,
            'end_time': duration,
            'energy': 0.5
        }]

    window_samples = sr * 2
    hop_samples = sr

    energies = []
    for i in range(0, max(1, len(samples) - window_samples), hop_samples):
        window = samples[i:i + window_samples]
        rms = float(np.sqrt(np.mean(window ** 2)))
        energies.append(rms)

    if len(energies) < 3:
        return [{
            'id': str(uuid.uuid4()),
            'label': 'intro',
            'start_time': 0.0,
            'end_time': duration,
            'energy': 0.5
        }]

    energies = np.array(energies)
    max_e = energies.max()
    if max_e > 0:
        energies = energies / max_e

    smoothed = uniform_filter1d(energies, size=min(5, len(energies)))

    diff = np.diff(smoothed)
    threshold = np.std(diff) * 1.0
    min_section_len = max(5, int(duration / 20))

    boundaries = [0]
    for i in range(1, len(diff)):
        if abs(diff[i]) > threshold and (i - boundaries[-1]) >= min_section_len:
            boundaries.append(i)
    boundaries.append(len(energies))

    if len(boundaries) < 4:
        num_sections = min(6, max(3, int(duration / 25)))
        section_len = len(energies) / num_sections
        boundaries = [int(i * section_len) for i in range(num_sections + 1)]

    if len(boundaries) > 9:
        merged = [boundaries[0]]
        for i in range(1, len(boundaries) - 1):
            if (boundaries[i] - merged[-1]) >= min_section_len:
                merged.append(boundaries[i])
        merged.append(boundaries[-1])
        boundaries = merged[:9]
        if boundaries[-1] != len(energies):
            boundaries.append(len(energies))

    sections = []
    for i in range(len(boundaries) - 1):
        start_idx = boundaries[i]
        end_idx = min(boundaries[i + 1], len(energies))
        start_time = float(start_idx)
        end_time = float(end_idx)

        if start_idx < end_idx and start_idx < len(smoothed):
            section_energy = float(np.mean(smoothed[start_idx:end_idx]))
        else:
            section_energy = 0.5

        if i == 0:
            label = 'intro'
        elif i == len(boundaries) - 2:
            label = 'outro'
        elif section_energy > 0.65:
            label = 'chorus'
        elif section_energy > 0.35:
            label = 'verse'
        else:
            label = 'bridge'

        sections.append({
            'id': str(uuid.uuid4()),
            'label': label,
            'start_time': start_time,
            'end_time': end_time,
            'energy': round(section_energy, 3)
        })

    return sections


def restructure_audio(audio_path: str, sections_order: list, crossfade_ms: int = 150) -> dict:
    audio = AudioSegment.from_file(audio_path)
    result = AudioSegment.empty()

    for section in sections_order:
        start_ms = int(section['start_time'] * 1000)
        end_ms = int(section['end_time'] * 1000)
        segment = audio[start_ms:end_ms]

        if len(result) > crossfade_ms and len(segment) > crossfade_ms:
            result = result.append(segment, crossfade=crossfade_ms)
        else:
            result += segment

    result = result.normalize()

    output_filename = f"restructured_{uuid.uuid4().hex[:8]}.mp3"
    output_path = str(PROCESSED_DIR / output_filename)
    result.export(output_path, format="mp3", bitrate="192k")

    waveform_data = extract_waveform(output_path)

    return {
        'filename': output_filename,
        'duration': waveform_data['duration'],
        'waveform': waveform_data['peaks']
    }


def create_collage(track_sections: list, crossfade_ms: int = 300) -> dict:
    result = AudioSegment.empty()

    for item in track_sections:
        audio = AudioSegment.from_file(item['audio_path'])
        start_ms = int(item['start_time'] * 1000)
        end_ms = int(item['end_time'] * 1000)
        segment = audio[start_ms:end_ms]

        if len(result) > crossfade_ms and len(segment) > crossfade_ms:
            result = result.append(segment, crossfade=crossfade_ms)
        else:
            result += segment

    result = result.normalize()

    output_filename = f"collage_{uuid.uuid4().hex[:8]}.mp3"
    output_path = str(PROCESSED_DIR / output_filename)
    result.export(output_path, format="mp3", bitrate="192k")

    waveform_data = extract_waveform(output_path)

    return {
        'filename': output_filename,
        'duration': waveform_data['duration'],
        'waveform': waveform_data['peaks']
    }


def export_track(audio_path: str, fmt: str = "mp3") -> str:
    audio = AudioSegment.from_file(audio_path)
    output_filename = f"export_{uuid.uuid4().hex[:8]}.{fmt}"
    output_path = str(PROCESSED_DIR / output_filename)

    if fmt == "wav":
        audio.export(output_path, format="wav")
    else:
        audio.export(output_path, format="mp3", bitrate="320k")

    return output_filename
