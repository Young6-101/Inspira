import { Play, X } from '@phosphor-icons/react';
import EditableNodeLabel from './EditableNodeLabel.tsx';

type AudioNodeProps = {
  onDelete: () => void;
  label?: string;
  onRename: (nextLabel: string) => void;
};

export default function AudioNode({ onDelete, label, onRename }: AudioNodeProps) {
  return (
    <div className="w-72 p-4 border border-textBlack bg-textBlack text-bgCream flex items-center gap-4">
      <button onClick={onDelete} className="delete-btn absolute -top-3 -right-3 w-8 h-8 bg-white border border-textBlack text-textBlack flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accentCoral shadow-[2px_2px_0px_#111]">
        <X size={14} weight="bold" />
      </button>
      <button className="w-12 h-12 shrink-0 bg-accentGold text-textBlack flex items-center justify-center border-2 border-textBlack shadow-[2px_2px_0px_#111]">
        <Play size={16} weight="fill" />
      </button>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-end mb-2">
          <EditableNodeLabel
            value={label}
            fallback="AUD_MEMO"
            onSave={onRename}
            textClassName="text-[10px] font-bold uppercase tracking-widest text-accentElectric"
            inputClassName="bg-bgCream text-textBlack"
            buttonClassName="bg-accentElectric text-textBlack hover:bg-white"
          />
          <span className="text-[10px] font-mono tracking-widest">0:12</span>
        </div>
        <div className="h-6 flex items-center gap-[3px] w-full">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 ${i < 5 ? 'bg-bgCream' : 'bg-gray-600'}`}
              style={{ height: `${((i % 5) + 1) * 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
