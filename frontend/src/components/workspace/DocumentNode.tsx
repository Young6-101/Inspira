import { FileText, X } from '@phosphor-icons/react';
import EditableNodeLabel from './EditableNodeLabel.tsx';

type DocumentNodeProps = {
  onDelete: () => void;
  label?: string;
  onRename: (nextLabel: string) => void;
};

export default function DocumentNode({ onDelete, label, onRename }: DocumentNodeProps) {
  return (
    <div className="w-[280px] p-3 flex flex-col gap-2">
      <button onClick={onDelete} className="delete-btn absolute -top-3 -right-3 w-8 h-8 bg-textBlack text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accentCoral border border-textBlack shadow-[2px_2px_0px_#111]">
        <X size={14} weight="bold" />
      </button>

      <div className="w-full h-[360px] border-2 border-textBlack bg-white p-4 flex flex-col gap-2">
        <div className="h-3 w-4/5 bg-gray-300" />
        <div className="h-3 w-full bg-gray-300" />
        <div className="h-3 w-11/12 bg-gray-300" />
        <div className="h-3 w-10/12 bg-gray-300" />
        <div className="h-3 w-full bg-gray-300" />
        <div className="h-3 w-3/4 bg-gray-300" />
        <div className="h-3 w-5/6 bg-gray-300" />
        <div className="h-3 w-4/5 bg-gray-300" />
        <div className="h-3 w-11/12 bg-gray-300" />
        <div className="h-3 w-3/5 bg-gray-300" />
        <div className="h-3 w-4/5 bg-gray-300" />
        <div className="h-3 w-full bg-gray-300" />
      </div>

      <div className="flex justify-between items-center px-1 pt-1">
        <EditableNodeLabel
          value={label}
          fallback="DOC_NODE"
          onSave={onRename}
          textClassName="text-[10px] font-bold uppercase tracking-widest"
        />
        <FileText size={16} className="text-accentElectric" weight="bold" />
      </div>
    </div>
  );
}
