import { PresentationChart, X } from '@phosphor-icons/react';
import EditableNodeLabel from './EditableNodeLabel.tsx';

type PresentationNodeProps = {
  onDelete: () => void;
  label?: string;
  onRename: (nextLabel: string) => void;
};

export default function PresentationNode({ onDelete, label, onRename }: PresentationNodeProps) {
  return (
    <div className="w-[360px] p-3 flex flex-col gap-2">
      <button onClick={onDelete} className="delete-btn absolute -top-3 -right-3 w-8 h-8 bg-textBlack text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accentCoral border border-textBlack shadow-[2px_2px_0px_#111]">
        <X size={14} weight="bold" />
      </button>

      <div className="w-full h-44 border-2 border-textBlack bg-[#dcdcd7] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-black/10" />
        <div className="absolute top-3 left-3 right-3 h-6 bg-white/80 border border-textBlack" />
        <div className="absolute top-12 left-3 w-32 h-24 bg-white/70 border border-textBlack" />
        <div className="absolute top-12 right-3 left-40 h-3 bg-white/70" />
        <div className="absolute top-18 right-3 left-40 h-3 bg-white/60" />
        <div className="absolute top-24 right-3 left-40 h-3 bg-white/50" />
        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white border border-textBlack px-2 py-1">
          <PresentationChart size={12} weight="bold" /> Preview
        </div>
      </div>

      <div className="flex justify-between items-center px-1 pt-1">
        <EditableNodeLabel
          value={label}
          fallback="PPT_NODE"
          onSave={onRename}
          textClassName="text-[10px] font-bold uppercase tracking-widest"
        />
        <PresentationChart size={16} className="text-accentViolet" weight="bold" />
      </div>
    </div>
  );
}
