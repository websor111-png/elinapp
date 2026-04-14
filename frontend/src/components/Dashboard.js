import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import UploadZone from './UploadZone';
import TrackList from './TrackList';
import WaveformCanvas from './WaveformCanvas';
import SectionEditor from './SectionEditor';
import PlaybackBar from './PlaybackBar';
import ExportDialog from './ExportDialog';
import { Waveform, Disc, FolderPlus, ShieldCheck, DesktopTower } from '@phosphor-icons/react';
import MaskingPanel from './MaskingPanel';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SECTION_COLORS_BG = {
  intro: 'bg-pink-500 hover:bg-pink-400',
  verse: 'bg-cyan-500 hover:bg-cyan-400',
  chorus: 'bg-green-500 hover:bg-green-400',
  bridge: 'bg-purple-500 hover:bg-purple-400',
  outro: 'bg-orange-500 hover:bg-orange-400',
};

const SECTION_COLORS_STATIC = {
  intro: 'bg-pink-500',
  verse: 'bg-cyan-500',
  chorus: 'bg-green-500',
  bridge: 'bg-purple-500',
  outro: 'bg-orange-500',
};

const Dashboard = () => {
  const [tracks, setTracks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [mode, setMode] = useState('restructure');
  const [collageSections, setCollageSections] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  const audioRef = useRef(null);

  const fetchTracks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tracks`);
      setTracks(res.data);
    } catch (e) {
      console.error('Error fetching tracks:', e);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
    fetchProjects();
  }, [fetchTracks, fetchProjects]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleUpload = async (file) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/tracks/upload`, formData);
      toast.success(`Uploaded: ${res.data.original_name}`);
      await fetchTracks();
      handleSelectTrack(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
    setSelectedProject(null);
    setSections(track.sections || []);
    setIsPlaying(false);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = `${API}/audio/${track.filename}`;
      audioRef.current.load();
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setSelectedTrack(null);
    setSections([]);
    setIsPlaying(false);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = `${API}/audio/${project.output_filename}`;
      audioRef.current.load();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedTrack) return;
    setIsAnalyzing(true);
    try {
      const res = await axios.post(`${API}/tracks/${selectedTrack.id}/analyze`);
      setSections(res.data.sections);
      setSelectedTrack(res.data);
      toast.success('Structure analyzed!');
      await fetchTracks();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRestructure = async () => {
    if (!selectedTrack || sections.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await axios.post(`${API}/restructure`, {
        track_id: selectedTrack.id,
        sections: sections.map(s => ({
          start_time: s.start_time,
          end_time: s.end_time
        })),
        name: `Restructured - ${selectedTrack.original_name}`
      });
      toast.success('Restructured successfully!');
      await fetchProjects();
      handleSelectProject(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Restructure failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCollage = async () => {
    if (collageSections.length < 2) {
      toast.error('Add at least 2 sections for a collage');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await axios.post(`${API}/collage`, {
        sections: collageSections.map(s => ({
          track_id: s.track_id,
          start_time: s.start_time,
          end_time: s.end_time
        })),
        name: 'Collage'
      });
      toast.success('Collage created!');
      await fetchProjects();
      handleSelectProject(res.data);
      setCollageSections([]);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Collage failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMask = async (maskOptions) => {
    setIsProcessing(true);
    try {
      const res = await axios.post(`${API}/mask`, maskOptions);
      toast.success('AI Masking applied!');
      await fetchProjects();
      handleSelectProject(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Masking failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCollage = (track, section) => {
    setCollageSections(prev => [...prev, {
      ...section,
      track_id: track.id,
      track_name: track.original_name
    }]);
    toast.success(`Added ${section.label} to collage`);
  };

  const handleDeleteTrack = async (trackId) => {
    try {
      await axios.delete(`${API}/tracks/${trackId}`);
      if (selectedTrack?.id === trackId) {
        setSelectedTrack(null);
        setSections([]);
      }
      await fetchTracks();
      toast.success('Track deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await axios.delete(`${API}/projects/${projectId}`);
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      await fetchProjects();
      toast.success('Project deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current?.src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
      toast.success('App installed on desktop!');
    }
  };

  const currentWaveform = selectedTrack?.waveform || selectedProject?.waveform || [];
  const currentName = selectedTrack?.original_name || selectedProject?.name || '';
  const currentDuration = selectedTrack?.duration || selectedProject?.duration || duration;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-violet-50 via-blue-50 to-sky-50 text-slate-900 font-['Outfit']" data-testid="dashboard">
      <header className="flex items-center justify-between px-6 py-3 border-b border-violet-200 bg-white/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Waveform size={28} weight="duotone" className="text-violet-600" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">Elyn MusicMasking</h1>
          <span className="text-xs text-slate-500 font-['IBM_Plex_Mono'] uppercase tracking-[0.2em] hidden sm:inline">
            Audio Masking & Restructure
          </span>
        </div>
        <div className="flex items-center gap-2">
          {installPrompt && (
            <Button
              onClick={handleInstall}
              variant="outline"
              className="border-violet-300 hover:bg-violet-100 rounded-sm text-xs font-medium text-violet-600 h-8"
              data-testid="install-desktop-btn"
            >
              <DesktopTower size={14} className="mr-1.5" /> Instaleaza pe Desktop
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        <aside className="col-span-1 lg:col-span-3 border-r border-violet-200 bg-white/60 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-violet-200">
            <UploadZone onUpload={handleUpload} isUploading={isUploading} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <TrackList
              tracks={tracks}
              projects={projects}
              selectedTrackId={selectedTrack?.id}
              selectedProjectId={selectedProject?.id}
              onSelectTrack={handleSelectTrack}
              onSelectProject={handleSelectProject}
              onDeleteTrack={handleDeleteTrack}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        </aside>

        <main className="col-span-1 lg:col-span-9 flex flex-col overflow-hidden">
          {currentWaveform.length > 0 ? (
            <>
              <div className="p-4 pb-2">
                <WaveformCanvas
                  peaks={currentWaveform}
                  sections={selectedTrack ? sections : []}
                  currentTime={currentTime}
                  duration={currentDuration}
                  onSeek={seek}
                />
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-2">
                <Tabs value={mode} onValueChange={setMode}>
                  <TabsList className="bg-violet-50 border border-violet-200 rounded-sm h-9">
                    <TabsTrigger
                      value="restructure"
                      className="rounded-sm data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs font-medium"
                      data-testid="tab-restructure"
                    >
                      <Waveform size={14} className="mr-1.5" /> Restructure
                    </TabsTrigger>
                    <TabsTrigger
                      value="collage"
                      className="rounded-sm data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs font-medium"
                      data-testid="tab-collage"
                    >
                      <FolderPlus size={14} className="mr-1.5" /> Collage
                    </TabsTrigger>
                    <TabsTrigger
                      value="masking"
                      className="rounded-sm data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs font-medium"
                      data-testid="tab-masking"
                    >
                      <ShieldCheck size={14} className="mr-1.5" /> AI Masking
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="restructure" className="mt-3">
                    <SectionEditor
                      sections={sections}
                      onReorder={setSections}
                      onAnalyze={handleAnalyze}
                      onRestructure={handleRestructure}
                      isAnalyzing={isAnalyzing}
                      isProcessing={isProcessing}
                      trackSelected={!!selectedTrack}
                      trackAnalyzed={selectedTrack?.analyzed}
                    />
                  </TabsContent>

                  <TabsContent value="collage" className="mt-3">
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 font-['IBM_Plex_Mono'] uppercase tracking-[0.2em]">
                        Select sections from analyzed tracks
                      </p>

                      <div className="space-y-2">
                        {tracks.filter(t => t.analyzed && t.sections?.length > 0).map(track => (
                          <div key={track.id} className="border border-violet-200 p-3">
                            <p className="text-sm font-medium mb-2 truncate">{track.original_name}</p>
                            <div className="flex flex-wrap gap-1">
                              {track.sections.map(section => (
                                <button
                                  key={section.id}
                                  onClick={() => addToCollage(track, section)}
                                  className={`px-2 py-1 text-xs font-['IBM_Plex_Mono'] uppercase ${SECTION_COLORS_BG[section.label] || 'bg-slate-400 hover:bg-slate-300'} text-white transition-colors duration-150`}
                                  data-testid={`collage-add-${section.id}`}
                                >
                                  + {section.label} ({(section.end_time - section.start_time).toFixed(0)}s)
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        {tracks.filter(t => t.analyzed).length === 0 && (
                          <p className="text-slate-500 text-sm font-['IBM_Plex_Mono']">
                            Analyze some tracks first to use collage mode.
                          </p>
                        )}
                      </div>

                      {collageSections.length > 0 && (
                        <div className="border border-violet-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500 font-['IBM_Plex_Mono'] uppercase tracking-[0.2em]">
                              Collage Timeline
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCollageSections([])}
                              className="text-slate-500 hover:text-slate-900 rounded-sm text-xs h-6 px-2"
                              data-testid="collage-clear"
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {collageSections.map((s, i) => (
                              <div
                                key={i}
                                className={`px-2 py-1 text-xs font-['IBM_Plex_Mono'] ${SECTION_COLORS_STATIC[s.label] || 'bg-slate-400'} text-white flex items-center gap-1`}
                              >
                                <span className="truncate max-w-[80px]">{s.track_name?.split('.')[0]}</span>
                                <span className="opacity-70">/ {s.label}</span>
                                <button
                                  onClick={() => setCollageSections(prev => prev.filter((_, idx) => idx !== i))}
                                  className="ml-1 opacity-60 hover:opacity-100"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                          <Button
                            onClick={handleCreateCollage}
                            disabled={isProcessing || collageSections.length < 2}
                            className="mt-3 bg-violet-600 text-white hover:bg-violet-500 rounded-sm font-medium text-sm"
                            data-testid="create-collage-btn"
                          >
                            {isProcessing ? 'Creating...' : 'Create Collage'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="masking" className="mt-3">
                    <MaskingPanel
                      trackId={selectedTrack?.id}
                      trackName={selectedTrack?.original_name}
                      isProcessing={isProcessing}
                      onMask={handleMask}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <PlaybackBar
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={currentDuration}
                onTogglePlay={togglePlay}
                onSeek={seek}
                trackName={currentName}
                onExport={() => setShowExport(true)}
                volume={volume}
                onVolumeChange={setVolume}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center relative">
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: 'url(https://images.pexels.com/photos/9404662/pexels-photo-9404662.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="text-center z-10">
                <Disc size={64} weight="duotone" className="text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-slate-500 tracking-tight" data-testid="empty-state-title">
                  No track selected
                </h2>
                <p className="text-slate-400 text-sm mt-2 font-['IBM_Plex_Mono']">
                  Upload a track or select one from the library
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <audio ref={audioRef} crossOrigin="anonymous" />

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        trackId={selectedTrack?.id}
        projectId={selectedProject?.id}
      />
    </div>
  );
};

export default Dashboard;
