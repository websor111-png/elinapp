import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MagnifyingGlass, Shuffle, DotsSixVertical } from '@phosphor-icons/react';

const SECTION_STYLES = {
  intro: { bg: 'bg-pink-500', text: 'text-pink-50', border: 'border-pink-400' },
  verse: { bg: 'bg-cyan-500', text: 'text-cyan-50', border: 'border-cyan-400' },
  chorus: { bg: 'bg-green-500', text: 'text-green-50', border: 'border-green-400' },
  bridge: { bg: 'bg-purple-500', text: 'text-purple-50', border: 'border-purple-400' },
  outro: { bg: 'bg-orange-500', text: 'text-orange-50', border: 'border-orange-400' },
};

const LABELS = ['intro', 'verse', 'chorus', 'bridge', 'outro'];

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const SectionEditor = ({
  sections,
  onReorder,
  onAnalyze,
  onRestructure,
  isAnalyzing,
  isProcessing,
  trackSelected,
  trackAnalyzed,
}) => {
  const [editingId, setEditingId] = useState(null);

  const updateLabel = (sectionId, newLabel) => {
    onReorder(sections.map(s => (s.id === sectionId ? { ...s, label: newLabel } : s)));
    setEditingId(null);
  };

  if (!trackSelected) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm font-['IBM_Plex_Mono']" data-testid="section-editor-empty">
        Select a track to edit its structure
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="section-editor">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="bg-yellow-400 text-black hover:bg-yellow-300 rounded-none font-medium text-sm h-8"
          data-testid="analyze-btn"
        >
          <MagnifyingGlass size={14} className="mr-1.5" />
          {isAnalyzing ? 'Analyzing...' : 'Analyze Structure'}
        </Button>

        {sections.length > 0 && (
          <Button
            onClick={onRestructure}
            disabled={isProcessing}
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800 rounded-none font-medium text-sm h-8"
            data-testid="restructure-btn"
          >
            <Shuffle size={14} className="mr-1.5" />
            {isProcessing ? 'Processing...' : 'Apply Restructure'}
          </Button>
        )}
      </div>

      {sections.length > 0 ? (
        <Reorder.Group axis="y" values={sections} onReorder={onReorder} className="space-y-1">
          {sections.map((section) => {
            const style = SECTION_STYLES[section.label] || SECTION_STYLES.verse;
            const dur = section.end_time - section.start_time;

            return (
              <Reorder.Item
                key={section.id}
                value={section}
                className={`flex items-center gap-3 p-2.5 border ${style.border} ${style.bg} ${style.text} cursor-grab active:cursor-grabbing active:opacity-80 active:ring-2 active:ring-yellow-400 transition-all duration-150`}
                data-testid={`section-block-${section.id}`}
              >
                <DotsSixVertical size={16} weight="bold" className="opacity-60 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  {editingId === section.id ? (
                    <div className="flex gap-1 flex-wrap">
                      {LABELS.map(l => (
                        <button
                          key={l}
                          onClick={(e) => { e.stopPropagation(); updateLabel(section.id, l); }}
                          className="px-2 py-0.5 text-[10px] bg-black/20 hover:bg-black/40 uppercase font-['IBM_Plex_Mono'] tracking-wider"
                          data-testid={`label-option-${l}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(section.id); }}
                      className="text-xs font-bold uppercase font-['IBM_Plex_Mono'] tracking-[0.15em] hover:underline"
                      data-testid={`section-label-${section.id}`}
                    >
                      {section.label}
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-['IBM_Plex_Mono'] opacity-80 flex-shrink-0">
                  {formatTime(section.start_time)} - {formatTime(section.end_time)}
                </span>
                <span className="text-[10px] font-['IBM_Plex_Mono'] opacity-60 flex-shrink-0 w-8 text-right">
                  {dur.toFixed(0)}s
                </span>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      ) : trackAnalyzed ? (
        <p className="text-zinc-500 text-sm font-['IBM_Plex_Mono']" data-testid="no-sections-msg">
          No sections detected. Try re-analyzing.
        </p>
      ) : (
        <p className="text-zinc-500 text-sm font-['IBM_Plex_Mono']" data-testid="analyze-prompt">
          Click "Analyze Structure" to detect song sections.
        </p>
      )}
    </div>
  );
};

export default SectionEditor;
