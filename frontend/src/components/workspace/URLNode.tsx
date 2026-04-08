import { GlobeHemisphereWest, LinkSimple, X } from '@phosphor-icons/react';
import EditableNodeLabel from './EditableNodeLabel.tsx';

type URLNodeProps = {
  onDelete: () => void;
  label?: string;
  url?: string;
  onRename: (nextLabel: string) => void;
};

export default function URLNode({ onDelete, label, url, onRename }: URLNodeProps) {
  const href = url?.trim() || '#';
  const display = href.replace(/^https?:\/\//i, '') || 'No URL';

  return (
    <div className="w-[320px] p-4 flex flex-col gap-3 bg-white">
      <button onClick={onDelete} className="delete-btn absolute -top-3 -right-3 w-8 h-8 bg-textBlack text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accentCoral border border-textBlack shadow-[2px_2px_0px_#111]">
        <X size={14} weight="bold" />
      </button>

      <div className="flex items-center justify-between border-b-2 border-textBlack pb-2">
        <EditableNodeLabel
          value={label}
          fallback="URL_NODE"
          onSave={onRename}
          textClassName="text-[10px] font-bold uppercase tracking-widest text-textBlack"
        />
        <GlobeHemisphereWest size={16} className="text-accentElectric" weight="fill" />
      </div>

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="w-full border border-textBlack bg-bgCream px-3 py-2 text-sm font-medium break-all hover:bg-accentElectric/20"
      >
        {display}
      </a>

      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
        <LinkSimple size={12} weight="bold" /> External resource node
      </div>
    </div>
  );
}
