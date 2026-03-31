import { Asterisk, Plus, SquaresFour, TextT } from '@phosphor-icons/react';

type WorkspaceToolbarProps = {
  onTypeThoughts: () => void;
  onAdd: () => void;
  onOrganize: () => void;
  aiVisible: boolean;
  onToggleAi: () => void;
};

export default function WorkspaceToolbar({ onTypeThoughts, onAdd, onOrganize, aiVisible, onToggleAi }: WorkspaceToolbarProps) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white border-2 border-textBlack shadow-[6px_6px_0px_#111] p-1 flex items-center z-40">
      <button onClick={onTypeThoughts} className="flex items-center gap-2 px-5 py-3 hover:bg-accentViolet/20 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-textBlack">
        <TextT size={14} weight="bold" /> Type Thoughts
      </button>
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      <button onClick={onAdd} className="flex items-center gap-2 px-5 py-3 hover:bg-accentCoral/20 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-textBlack">
        <Plus size={14} weight="bold" /> Upload
      </button>
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      <button onClick={onOrganize} className="flex items-center gap-2 px-5 py-3 hover:bg-accentElectric/20 text-xs font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-textBlack">
        <SquaresFour size={14} weight="bold" /> Grid Align
      </button>
      <div className="w-0.5 h-8 bg-textBlack mx-1" />
      <button
        onClick={onToggleAi}
        className={`flex items-center gap-2 px-5 py-3 border border-textBlack text-xs font-bold uppercase tracking-widest transition-colors ${aiVisible ? 'bg-textBlack text-bgCream' : 'bg-white text-textBlack hover:bg-accentElectric'}`}
      >
        <Asterisk size={14} weight="bold" /> {aiVisible ? 'Close AI' : 'Open AI'}
      </button>
    </div>
  );
}
