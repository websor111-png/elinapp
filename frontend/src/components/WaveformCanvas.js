import { useRef, useEffect, useCallback } from 'react';

const SECTION_COLORS = {
  intro: '#ec4899',
  verse: '#06b6d4',
  chorus: '#22c55e',
  bridge: '#a855f7',
  outro: '#f97316',
};

const WaveformCanvas = ({ peaks, sections, currentTime, duration, onSeek }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !peaks || peaks.length === 0) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#27272a44';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Time markers
    if (duration > 0) {
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#52525b';
      ctx.textAlign = 'center';
      const interval = duration > 120 ? 30 : duration > 60 ? 15 : 10;
      for (let t = 0; t <= duration; t += interval) {
        const x = (t / duration) * width;
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, x, height - 4);
      }
    }

    // Waveform bars
    const barWidth = Math.max(1, (width / peaks.length) - 0.3);
    const centerY = height / 2;
    const maxBarHeight = height * 0.7;

    peaks.forEach((peak, i) => {
      const x = (i / peaks.length) * width;
      const barHeight = Math.max(1, Math.abs(peak) * maxBarHeight);

      if (duration > 0 && sections.length > 0) {
        const timeAtBar = (i / peaks.length) * duration;
        const section = sections.find(s => timeAtBar >= s.start_time && timeAtBar < s.end_time);
        ctx.fillStyle = section ? (SECTION_COLORS[section.label] || '#facc15') : '#52525b';
      } else {
        ctx.fillStyle = '#52525b';
      }

      ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
    });

    // Section boundaries and labels
    if (sections.length > 0 && duration > 0) {
      sections.forEach(section => {
        const startX = (section.start_time / duration) * width;
        const endX = (section.end_time / duration) * width;
        const midX = (startX + endX) / 2;

        // Boundary line
        ctx.strokeStyle = '#3f3f4699';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label pill
        const label = section.label.toUpperCase();
        ctx.font = '9px "IBM Plex Mono", monospace';
        const textWidth = ctx.measureText(label).width + 10;
        const pillHeight = 16;

        ctx.fillStyle = SECTION_COLORS[section.label] || '#facc15';
        ctx.fillRect(midX - textWidth / 2, 4, textWidth, pillHeight);

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, 4 + pillHeight / 2);
      });
    }

    // Playhead
    if (duration > 0 && currentTime >= 0) {
      const playheadX = (currentTime / duration) * width;

      ctx.save();
      ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(playheadX - 1, 0, 2, height);
      ctx.restore();

      // Playhead time
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const mins = Math.floor(currentTime / 60);
      const secs = Math.floor(currentTime % 60);
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      const tx = playheadX + 4 > width - 40 ? playheadX - 44 : playheadX + 4;
      ctx.fillText(timeStr, tx, 24);
    }
  }, [peaks, sections, currentTime, duration]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleClick = (e) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(Math.max(0, Math.min(duration, ratio * duration)));
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-48 border border-zinc-800 bg-zinc-900/50 cursor-crosshair relative"
      onClick={handleClick}
      data-testid="waveform-canvas"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default WaveformCanvas;
