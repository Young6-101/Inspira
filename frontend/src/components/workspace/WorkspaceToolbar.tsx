import { Asterisk, LinkSimple, Plus, SquaresFour, TextT } from '@phosphor-icons/react';

type WorkspaceToolbarProps = {
  onTypeThoughts: () => void;
  onInputUrl: () => void;
  onAdd: () => void;
  onOrganize: () => void;
  onCluster: () => void;
  onClearCluster: () => void;
  clusterActive: boolean;
  aiVisible: boolean;
  onToggleAi: () => void;
};

export default function WorkspaceToolbar({ onTypeThoughts, onInputUrl, onAdd, onOrganize, onCluster, onClearCluster, clusterActive, aiVisible, onToggleAi }: WorkspaceToolbarProps) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white border-2 border-textBlack shadow-[6px_6px_0px_#111] p-1 flex flex-nowrap items-center z-40 w-max">
      <button onClick={onTypeThoughts} className="shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 hover:bg-accentViolet/20 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-textBlack">
        <TextT size={14} weight="bold" /> Type thoughts
      </button>
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      <button onClick={onInputUrl} className="shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 hover:bg-accentElectric/20 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-textBlack">
        <LinkSimple size={14} weight="bold" /> Input URL
      </button>
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      <button onClick={onAdd} className="shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 hover:bg-accentCoral/20 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-textBlack">
        <Plus size={14} weight="bold" /> Upload
      </button>
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      <button onClick={onOrganize} className="shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 hover:bg-accentElectric/20 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-textBlack">
        <SquaresFour size={14} weight="bold" /> Grid Align
      </button>
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      {clusterActive ? (
        <button onClick={onClearCluster} className="shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 border border-textBlack text-xs font-bold uppercase tracking-widest transition-colors bg-accentCoral/20 text-textBlack hover:bg-accentCoral/40">
          <Asterisk size={14} weight="bold" /> Clear Graph
        </button>
      ) : (
        <button onClick={onCluster} className="shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 border border-textBlack text-xs font-bold uppercase tracking-widest transition-colors bg-white text-textBlack hover:bg-accentViolet/20">
          <Asterisk size={14} weight="bold" /> Cluster Graph
        </button>
      )}
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      <button
        onClick={onToggleAi}
        className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 border border-textBlack text-xs font-bold uppercase tracking-widest transition-colors ${aiVisible ? 'bg-textBlack text-bgCream' : 'bg-white text-textBlack hover:bg-accentElectric'}`}
      >
        <Asterisk size={14} weight="bold" /> {aiVisible ? 'Close AI' : 'Open AI'}
      </button>
    </div>
  );
}
