import { Asterisk, Folders } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

type TopNavProps = {
  inWorkspace: boolean;
  currentStackName: string;
  onHome: () => void;
  onArchives: () => void;
  onWorkspace: () => void;
  authControl: ReactNode;
};

export default function TopNav({ inWorkspace, currentStackName, onHome, onArchives, onWorkspace, authControl }: TopNavProps) {
  return (
    <nav className="h-20 border-b-2 border-textBlack bg-bgCream flex items-center justify-between px-6 shrink-0 z-50 relative">
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-accentCoral via-accentElectric to-accentViolet opacity-50" />

      <button onClick={onHome} className="flex items-center gap-4 group">
        <div className="w-9 h-9 bg-accentCoral text-textBlack flex items-center justify-center group-hover:rotate-90 transition-transform border-2 border-textBlack shadow-[2px_2px_0px_#111]">
          <Asterisk weight="bold" size={16} />
        </div>
        <span className="text-3xl font-display uppercase tracking-wider mt-1">Inspira</span>
      </button>

      <button
        onClick={onArchives}
        title="Back to Archives"
        className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 border border-textBlack bg-white text-sm font-bold uppercase tracking-widest transition-opacity duration-300 hover:bg-accentElectric/20 ${inWorkspace ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
      >
        <Folders size={16} weight="bold" />
        <span>{currentStackName}</span>
      </button>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={onHome} className="text-sm font-bold uppercase tracking-widest hover:text-accentCoral transition-colors">Home</button>
          <button onClick={onArchives} className="text-sm font-bold uppercase tracking-widest hover:text-accentElectric transition-colors">Archives</button>
          <button onClick={onWorkspace} className="text-sm font-bold uppercase tracking-widest hover:text-accentViolet transition-colors">Workspace</button>
        </div>
        {authControl}
      </div>
    </nav>
  );
}
