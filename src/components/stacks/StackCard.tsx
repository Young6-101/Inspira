import { ArrowUpRight, PencilSimple, Trash } from '@phosphor-icons/react';

type Stack = {
  id: string;
  name: string;
  fileCount: number;
  type: string;
};

type StackCardProps = {
  stack: Stack;
  onOpen: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export default function StackCard({ stack, onOpen, onDelete, onEdit }: StackCardProps) {
  return (
    <div onClick={onOpen} className="group relative brutalist-card p-6 md:p-8 flex flex-col h-72 cursor-pointer border-2 border-textBlack">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center bg-white border border-textBlack opacity-0 group-hover:opacity-100 hover:bg-accentElectric transition-all z-20 shadow-[2px_2px_0px_#111]"
      >
        <PencilSimple size={16} weight="bold" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white border border-textBlack opacity-0 group-hover:opacity-100 hover:bg-accentCoral transition-all z-20 shadow-[2px_2px_0px_#111]"
      >
        <Trash size={18} weight="bold" />
      </button>
      <div className="flex justify-between items-start mb-8">
        <span className="text-[10px] font-bold uppercase tracking-widest border border-textBlack px-3 py-1.5 bg-bgCream shadow-[2px_2px_0px_#111]">{stack.type}</span>
        <span className="text-[12px] font-mono font-bold border-b-2 border-textBlack pb-1">ID:{stack.id}</span>
      </div>
      <h3 className="text-4xl font-display uppercase tracking-wide leading-none mb-auto group-hover:text-accentElectric transition-colors">{stack.name}</h3>
      <div className="mt-6 pt-6 border-t-2 border-textBlack flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Nodes</span>
          <span className="font-display text-4xl">{stack.fileCount}</span>
        </div>
        <div className="w-10 h-10 border-2 border-textBlack flex items-center justify-center bg-bgCream group-hover:bg-accentElectric group-hover:shadow-[2px_2px_0px_#111] transition-all group-hover:-translate-y-1 group-hover:translate-x-1">
          <ArrowUpRight size={18} weight="bold" />
        </div>
      </div>
    </div>
  );
}
