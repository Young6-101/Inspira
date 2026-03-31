import { ArrowRight, Asterisk, X } from '@phosphor-icons/react';

type AIPanelProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AIPanel({ visible, onClose }: AIPanelProps) {
  return (
    <aside
      className={`bg-white flex flex-col shrink-0 transition-all duration-300 ease-out relative z-30 overflow-hidden ${visible ? 'w-[360px] border-l border-textBlack' : 'w-0 border-l-0 pointer-events-none'}`}
    >
      <div className="h-14 border-b-2 border-textBlack flex items-center justify-between px-4 shrink-0 bg-bgCream">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-textBlack">
          <Asterisk size={14} weight="bold" className="text-accentCoral" /> Synthesizer
        </div>
        <button onClick={onClose} className="w-8 h-8 border border-textBlack flex items-center justify-center hover:bg-accentCoral transition-colors bg-white">
          <X size={14} weight="bold" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 bg-white">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System</span>
          <div className="border border-textBlack p-4 text-sm bg-bgCream font-medium shadow-[2px_2px_0px_#111]">
            Awaiting spatial data. Drop fragments to begin structural analysis.
          </div>
        </div>
      </div>
      <div className="p-4 border-t-2 border-textBlack bg-bgCream shrink-0">
        <div className="relative flex items-center bg-white border border-textBlack shadow-[2px_2px_0px_#111]">
          <input type="text" placeholder="Enter command..." className="w-full bg-transparent border-none py-3 pl-4 pr-12 text-sm font-medium placeholder-gray-500 focus:outline-none" />
          <button className="absolute right-2 w-8 h-8 flex items-center justify-center bg-textBlack text-white hover:bg-accentElectric hover:text-textBlack border border-textBlack transition-colors">
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>
    </aside>
  );
}
