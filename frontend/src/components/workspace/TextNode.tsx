import { TextT, X } from '@phosphor-icons/react';
import EditableNodeLabel from './EditableNodeLabel.tsx';

type TextNodeProps = {
  onDelete: () => void;
  label?: string;
  textPreview?: string;
  onRename: (nextLabel: string) => void;
};

export default function TextNode({ onDelete, label, textPreview, onRename }: TextNodeProps) {
  const content = textPreview || 'Grid systems in brutalism aren\'t just for alignment; they are the aesthetic.';
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const dynamicMinHeight = Math.min(420, 150 + Math.ceil(wordCount / 12) * 20);

  return (
    <div className="w-64 p-5 flex flex-col gap-3" style={{ minHeight: dynamicMinHeight }}>
      <button onClick={onDelete} className="delete-btn absolute -top-3 -right-3 w-8 h-8 bg-textBlack text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accentCoral border border-textBlack shadow-[2px_2px_0px_#111]">
        <X size={14} weight="bold" />
      </button>
      <div className="flex items-center justify-between border-b-2 border-textBlack pb-2">
        <EditableNodeLabel
          value={label}
          fallback="TXT_NODE"
          onSave={onRename}
          textClassName="text-[10px] font-bold uppercase tracking-widest text-textBlack"
        />
        <TextT size={16} className="text-accentCoral" weight="fill" />
      </div>
      <p className="w-full text-sm font-medium leading-snug whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{content}</p>
    </div>
  );
}
