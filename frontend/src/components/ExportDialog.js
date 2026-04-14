import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileAudio, DownloadSimple } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExportDialog = ({ open, onClose, trackId, projectId }) => {
  const [format, setFormat] = useState('mp3');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await axios.post(`${API}/export`, {
        track_id: trackId || undefined,
        project_id: projectId || undefined,
        format,
      });

      const link = document.createElement('a');
      link.href = `${API}/audio/${res.data.filename}`;
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported as ${format.toUpperCase()}`);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border border-zinc-800 rounded-none max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white font-['Outfit']">Export Audio</DialogTitle>
          <DialogDescription className="text-zinc-500 font-['IBM_Plex_Mono'] text-xs">
            Choose format and download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            {['mp3', 'wav'].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 p-3 border text-center uppercase font-['IBM_Plex_Mono'] text-sm transition-colors duration-150 ${
                  format === f
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                }`}
                data-testid={`export-format-${f}`}
              >
                <FileAudio size={20} className="mx-auto mb-1" />
                {f}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-600 font-['IBM_Plex_Mono']">
            {format === 'mp3'
              ? 'MP3 320kbps - Compressed - Smaller file'
              : 'WAV - Uncompressed - Full quality'}
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting || (!trackId && !projectId)}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 rounded-none font-medium"
            data-testid="export-download-btn"
          >
            <DownloadSimple size={16} className="mr-2" />
            {isExporting ? 'Exporting...' : 'Download'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
