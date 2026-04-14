import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Export, SpeakerHigh, SpeakerLow } from '@phosphor-icons/react';

const formatTime = (t) => {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PlaybackBar = ({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  trackName,
  onExport,
  volume,
  onVolumeChange,
}) => {
  return (
    <div
      className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center gap-4 flex-shrink-0"
      data-testid="playback-bar"
    >
      <Button
        onClick={onTogglePlay}
        className="bg-yellow-400 text-black hover:bg-yellow-300 rounded-none h-9 w-9 p-0 flex-shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        data-testid="play-pause-btn"
      >
        {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
      </Button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate mb-1">{trackName || 'No track loaded'}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-['IBM_Plex_Mono'] w-8 flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            max={100}
            step={0.1}
            onValueChange={([v]) => onSeek((v / 100) * duration)}
            className="flex-1"
            data-testid="seek-slider"
          />
          <span className="text-[10px] text-zinc-500 font-['IBM_Plex_Mono'] w-8 flex-shrink-0 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <SpeakerLow size={14} className="text-zinc-500" />
        <Slider
          value={[volume]}
          max={100}
          step={1}
          onValueChange={([v]) => onVolumeChange(v)}
          className="w-16"
          data-testid="volume-slider"
        />
        <SpeakerHigh size={14} className="text-zinc-500" />
      </div>

      <Button
        onClick={onExport}
        variant="outline"
        className="border-zinc-700 hover:bg-zinc-800 rounded-none text-xs flex-shrink-0 h-8"
        data-testid="export-btn"
      >
        <Export size={14} className="mr-1" /> Export
      </Button>
    </div>
  );
};

export default PlaybackBar;
