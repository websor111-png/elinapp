# Elyn MusicMasking - Audio Restructuring & AI Masking App PRD

## Original Problem Statement
1. Redenumire aplicatie: Elyn MusicMasking
2. Tema deschisa pe culori violet, albastru si bleo
3. Sectiune pentru masking audio TikTok AI
4. Aplicatie pentru PC Windows (limitat de platforma web, PWA disponibil)

## Architecture
- **Backend**: FastAPI + MongoDB + pydub/scipy/numpy for audio processing
- **Frontend**: React + Tailwind CSS + Shadcn UI + Phosphor Icons + Framer Motion
- **Audio Processing**: Energy-based section detection, crossfade restructuring, AI fingerprint masking
- **Theme**: Light violet/blue/sky gradient

## Core Requirements
- Upload MP3/WAV audio files
- Analyze song structure (detect intro, verse, chorus, bridge, outro)
- Drag & drop section reordering
- Automatic restructuring with crossfade transitions
- Multi-song collage creation
- TikTok AI Masking (pitch shift, speed change, EQ, reverb, noise)
- Waveform visualization with colored sections
- Audio playback controls
- Export to MP3/WAV formats

## What's Been Implemented (Feb 2026)
- Full backend API (upload, analyze, restructure, collage, mask, export, audio serving) - 11 endpoints
- AI Masking pipeline: pitch shift, speed change, EQ modification, micro reverb, noise layer
- Light violet/blue/sky theme with gradient backgrounds
- Upload zone with drag & drop
- Track library sidebar with project list
- Canvas-based waveform visualization with colored sections
- Section editor with drag & drop via Framer Motion
- 3 tabs: Restructure, Collage, AI Masking
- MaskingPanel with intensity slider and 5 technique toggles
- Playback controls (play/pause, seek, volume)
- Export dialog with MP3/WAV format selection

## Testing Results
- Backend: 100% (11/11 API endpoints passing)
- Frontend: 94% (16/17 features working)

## Next Tasks
1. PWA support for desktop-like experience on Windows
2. Improve section detection with MFCC spectral features
3. Add beat-sync for precise section boundaries
4. Audio effects pipeline (additional EQ presets, compression)
