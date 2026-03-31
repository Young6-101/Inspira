import { PlayCircle, VideoCamera, X } from '@phosphor-icons/react';
import EditableNodeLabel from './EditableNodeLabel.tsx';

type VideoNodeProps = {
  onDelete: () => void;
  label?: string;
  onRename: (nextLabel: string) => void;
};

export default function VideoNode({ onDelete, label, onRename }: VideoNodeProps) {
  return (
    <div className="w-[420px] p-3 flex flex-col gap-2">
      <button onClick={onDelete} className="delete-btn absolute -top-3 -right-3 w-8 h-8 bg-textBlack text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accentCoral border border-textBlack shadow-[2px_2px_0px_#111]">
        <X size={14} weight="bold" />
      </button>

      <div className="w-full h-52 border-2 border-textBlack bg-[#d6d6d0] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
        <div className="absolute top-4 left-4 right-4 bottom-12 border border-textBlack bg-black/25" />
        <div className="absolute inset-x-0 top-0 h-8 bg-black/30 flex items-center px-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Video Preview</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle size={48} weight="fill" className="text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.4)]" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 h-6 border border-textBlack bg-white/80 flex items-center px-2">
          <div className="w-1/3 h-1.5 bg-gray-600" />
        </div>
      </div>

      <div className="flex justify-between items-center px-1 pt-1">
        <EditableNodeLabel
          value={label}
          fallback="VID_NODE"
          onSave={onRename}
          textClassName="text-[10px] font-bold uppercase tracking-widest"
        />
        <VideoCamera size={16} className="text-accentCoral" weight="bold" />
      </div>
    </div>
  );
}
