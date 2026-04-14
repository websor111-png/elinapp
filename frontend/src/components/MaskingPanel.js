import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, MusicNote, Timer, Sliders, SpeakerHigh, Waveform } from '@phosphor-icons/react';

const techniques = [
  { key: 'pitch_shift', label: 'Pitch Shift', desc: 'Modifica frecventele pentru a altera amprenta audio', icon: MusicNote },
  { key: 'speed_change', label: 'Speed Adjust', desc: 'Variatie subtila de tempo pentru deplasarea markerilor temporali', icon: Timer },
  { key: 'eq_modify', label: 'EQ Modify', desc: 'Boost bass & cut treble pentru schimbarea profilului spectral', icon: Sliders },
  { key: 'reverb', label: 'Micro Reverb', desc: 'Echo subtil pentru estomparea amprentei temporale', icon: SpeakerHigh },
  { key: 'noise', label: 'Noise Layer', desc: 'Zgomot de nivel scazut pentru randomizarea spectrului', icon: Waveform },
];

const MaskingPanel = ({ trackId, trackName, isProcessing, onMask }) => {
  const [intensity, setIntensity] = useState(50);
  const [options, setOptions] = useState({
    pitch_shift: true,
    speed_change: true,
    eq_modify: true,
    reverb: true,
    noise: true,
  });

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = () => {
    onMask({
      track_id: trackId,
      intensity,
      ...options,
      name: `Masked - ${trackName}`,
    });
  };

  if (!trackId) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm font-['IBM_Plex_Mono']" data-testid="masking-empty">
        Selecteaza un track pentru a aplica AI masking
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="masking-panel">
      <div className="border border-violet-300 bg-gradient-to-r from-violet-50 to-blue-50 p-4 rounded-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={20} weight="duotone" className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-800">TikTok AI Masking</h3>
        </div>
        <p className="text-xs text-slate-500 font-['IBM_Plex_Mono'] leading-relaxed">
          Modifica amprenta audio pentru a evita detectia AI de continut protejat, pastrand perceptia auditiva intacta.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-slate-600 font-['IBM_Plex_Mono'] uppercase tracking-wider">
            Intensitate Masking
          </Label>
          <span className="text-xs font-bold text-violet-600 font-['IBM_Plex_Mono']">{intensity}%</span>
        </div>
        <Slider
          value={[intensity]}
          min={10}
          max={100}
          step={5}
          onValueChange={([v]) => setIntensity(v)}
          data-testid="masking-intensity-slider"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-['IBM_Plex_Mono']">
          <span>Subtil</span>
          <span>Agresiv</span>
        </div>
      </div>

      <div className="space-y-2">
        {techniques.map(({ key, label, desc, icon: Icon }) => (
          <div
            key={key}
            className={`flex items-center justify-between p-3 border rounded-sm transition-colors duration-150 ${
              options[key]
                ? 'border-violet-300 bg-violet-50/80'
                : 'border-slate-200 bg-white'
            }`}
            data-testid={`masking-toggle-${key}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon size={18} weight="duotone" className={options[key] ? 'text-violet-600' : 'text-slate-400'} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-[10px] text-slate-500 font-['IBM_Plex_Mono'] truncate">{desc}</p>
              </div>
            </div>
            <Switch
              checked={options[key]}
              onCheckedChange={() => toggleOption(key)}
              data-testid={`masking-switch-${key}`}
              className="flex-shrink-0 ml-2"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleApply}
        disabled={isProcessing || !Object.values(options).some(v => v)}
        className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 rounded-sm font-medium"
        data-testid="apply-masking-btn"
      >
        <ShieldCheck size={16} className="mr-2" />
        {isProcessing ? 'Masking in progress...' : 'Aplica AI Masking'}
      </Button>
    </div>
  );
};

export default MaskingPanel;
