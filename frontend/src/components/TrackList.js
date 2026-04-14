import { MusicNote, Trash, Waveform } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';

const formatDuration = (d) => {
  if (!d || isNaN(d)) return '0:00';
  const m = Math.floor(d / 60);
  const s = Math.floor(d % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const TrackList = ({
  tracks,
  projects,
  selectedTrackId,
  selectedProjectId,
  onSelectTrack,
  onSelectProject,
  onDeleteTrack,
  onDeleteProject,
}) => {
  return (
    <div className="flex flex-col" data-testid="track-list">
      <div className="px-4 py-2">
        <p className="text-xs text-slate-500 font-['IBM_Plex_Mono'] uppercase tracking-[0.2em]">
          Tracks
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <MusicNote size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-['IBM_Plex_Mono']">No tracks uploaded yet</p>
        </div>
      ) : (
        <div>
          {tracks.map(track => (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-l-2 transition-colors duration-150 group ${
                selectedTrackId === track.id
                  ? 'border-l-violet-500 bg-violet-50'
                  : 'border-l-transparent hover:bg-violet-50'
              }`}
              data-testid={`track-item-${track.id}`}
            >
              <MusicNote
                size={16}
                className={selectedTrackId === track.id ? 'text-violet-600' : 'text-slate-400'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{track.original_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-['IBM_Plex_Mono']">
                    {formatDuration(track.duration)}
                  </span>
                  {track.analyzed && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4 border-emerald-500/50 text-emerald-600 rounded-sm"
                    >
                      Analyzed
                    </Badge>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTrack(track.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                data-testid={`delete-track-${track.id}`}
                aria-label="Delete track"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <>
          <div className="px-4 py-2 mt-1 border-t border-violet-200">
            <p className="text-xs text-slate-500 font-['IBM_Plex_Mono'] uppercase tracking-[0.2em]">
              Projects
            </p>
          </div>
          <div>
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-l-2 transition-colors duration-150 group ${
                  selectedProjectId === project.id
                    ? 'border-l-violet-500 bg-violet-50'
                    : 'border-l-transparent hover:bg-violet-50'
                }`}
                data-testid={`project-item-${project.id}`}
              >
                <Waveform
                  size={16}
                  className={selectedProjectId === project.id ? 'text-violet-600' : 'text-slate-400'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-['IBM_Plex_Mono']">
                      {formatDuration(project.duration)}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4 border-violet-500/50 text-violet-600 rounded-sm"
                    >
                      {project.type}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  data-testid={`delete-project-${project.id}`}
                  aria-label="Delete project"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TrackList;
