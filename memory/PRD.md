# SoundForge - Audio Restructuring App PRD

## Original Problem Statement
"Poti cre o aplicatie de pc care sa: Schimbe complet structura unei melodii sau a unui colaj de melodii, dar sa pastreze aceeasi perceptie auditiva?"

Build a web application that can completely change the structure of a song or collage of songs while maintaining the same auditory perception.

## Architecture
- **Backend**: FastAPI + MongoDB + pydub/scipy/numpy for audio processing
- **Frontend**: React + Tailwind CSS + Shadcn UI + Phosphor Icons + Framer Motion
- **Audio Processing**: Energy-based section detection, crossfade restructuring, volume normalization

## User Personas
- Music producers wanting to experiment with song structure
- DJs creating mashups and collages
- Content creators needing restructured background music

## Core Requirements
- Upload MP3/WAV audio files
- Analyze song structure (detect intro, verse, chorus, bridge, outro)
- Drag & drop section reordering
- Automatic restructuring with crossfade transitions
- Multi-song collage creation
- Waveform visualization with colored sections
- Audio playback controls
- Export to MP3/WAV formats

## What's Been Implemented (Feb 2026)
- Full backend API (upload, analyze, restructure, collage, export, audio serving)
- Audio processing pipeline (waveform extraction, energy-based section detection, restructuring, collage creation)
- Dark theme "Control Room" grid dashboard
- Upload zone with drag & drop
- Track library sidebar with project list
- Canvas-based waveform visualization with colored sections
- Section editor with drag & drop reordering via Framer Motion
- Playback controls (play/pause, seek, volume)
- Export dialog with MP3/WAV format selection
- Collage mode for combining sections from multiple tracks

## Testing Results
- Backend: 100% (10/10 API endpoints passing)
- Frontend: 95% (11/12 features working)

## Prioritized Backlog
### P0 (Critical) - Done
- [x] Audio upload and storage
- [x] Waveform extraction and visualization
- [x] Section detection algorithm
- [x] Audio restructuring with crossfade
- [x] Export functionality

### P1 (Important) - Future
- [ ] More sophisticated section detection (MFCC-based, self-similarity matrix)
- [ ] Tempo/key detection and matching
- [ ] Real-time waveform playback sync (requestAnimationFrame)
- [ ] Drag sections directly on waveform

### P2 (Nice to have) - Future
- [ ] Reverb tails at section boundaries
- [ ] Beat-aligned section boundaries
- [ ] Undo/redo for section reordering
- [ ] Audio effects (EQ, compression)
- [ ] YouTube link import
- [ ] Multi-user collaboration

## Next Tasks
1. Improve section detection with spectral features
2. Add beat-sync for more precise section boundaries
3. Implement pitch/tempo shifting to better match sections
4. Add audio effects pipeline
