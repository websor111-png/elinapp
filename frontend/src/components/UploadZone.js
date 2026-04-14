import { useRef, useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react';

const UploadZone = ({ onUpload, isUploading }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div
      onClick={() => !isUploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border border-dashed ${
        isDragging ? 'border-violet-500 bg-violet-600/5' : 'border-violet-300 hover:border-violet-400'
      } p-6 text-center cursor-pointer transition-colors duration-150`}
      data-testid="upload-zone"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.ogg,.flac,.m4a"
        onChange={handleFileChange}
        className="hidden"
        data-testid="upload-input"
      />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-['IBM_Plex_Mono']">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <UploadSimple size={24} className="text-slate-500" />
          <span className="text-xs text-slate-400 font-['IBM_Plex_Mono']">
            Drop audio file or click to upload
          </span>
          <span className="text-xs text-slate-400 font-['IBM_Plex_Mono']">MP3, WAV, OGG, FLAC</span>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
