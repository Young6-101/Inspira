import { Stack } from "../hooks/useStack";

export const Sidebar = ({ stacks }: { stacks: Stack[] }) => {
  return (
    <div className="h-screen w-64 p-8 flex flex-col bg-white border-r border-default-100 z-50">
      <h1 className="font-black text-2xl tracking-tighter text-[#0a86ce] mb-12 italic">Inspira</h1>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-default-400 uppercase tracking-[0.2em] mb-6">Your Stacks</p>
        <ul className="space-y-4">
          {stacks.map((s) => (
            <li key={s.id} className="flex items-center gap-3 text-sm font-semibold text-default-600 hover:text-[#0a86ce] cursor-pointer transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0a86ce]" /> {s.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};