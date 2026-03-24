import { Stack } from "../hooks/useStack";

export const Sidebar = ({ stacks }: { stacks: Stack[] }) => {
  return (
    <div className="h-screen w-48 md:w-52 lg:w-56 p-6 flex flex-col bg-white border-r border-default-100 z-50">
      <h1 className="font-black text-4xl tracking-tighter text-[#0a86ce] mb-12 italic text-center">Inspira</h1>
      <div className="flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-default-400 uppercase tracking-[0.2em] mb-4 text-center">Your Stacks</p>
        <ul className="space-y-2">
          {stacks.map((s) => (
            <li
              key={s.id}
              className="group relative p-3 rounded-lg bg-default-50 hover:bg-[#0a86ce] cursor-pointer transition-all duration-300 border border-transparent hover:border-[#0a86ce] hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#0a86ce] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 9V5H4V9H20ZM20 11H4V19H20V11ZM3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3Z" />
                </svg>
                <span className="text-sm font-semibold text-default-700 group-hover:text-white transition-colors truncate">
                  {s.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};