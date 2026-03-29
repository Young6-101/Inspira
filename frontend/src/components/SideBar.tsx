import { Stack } from "../hooks/useStack";

export const Sidebar = ({
  stacks,
  activeStackId,
  onStackClick,
  onLogoClick
}: {
  stacks: Stack[],
  activeStackId?: string | null,
  onStackClick?: (id: string) => void,
  onLogoClick?: () => void
}) => {
  return (
    <div className="h-full w-64 shrink-0 flex flex-col bg-white border-r border-gray-100 z-50">
      <div className="p-6 pb-0 flex flex-col h-full">
        <h1
          className="font-black text-4xl tracking-tighter text-[#0a86ce] mb-12 italic text-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onLogoClick}
        >
          Inspira
        </h1>
        <div className="flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Your Stacks</p>
          <ul className="space-y-2 pb-6">
            {stacks.map((s) => {
              const isActive = s.id === activeStackId;
              return (
                <li
                  key={s.id}
                  onClick={() => onStackClick?.(s.id)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-300 border hover:shadow-md ${isActive
                    ? "bg-[#0a86ce] border-[#0a86ce]"
                    : "bg-gray-50 border-transparent hover:bg-[#0a86ce] hover:border-[#0a86ce]"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-[#0a86ce] group-hover:text-white"}`} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 9V5H4V9H20ZM20 11H4V19H20V11ZM3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3Z" />
                    </svg>
                    <span className={`text-sm font-semibold transition-colors truncate ${isActive ? "text-white" : "text-gray-700 group-hover:text-white"}`}>
                      {s.name}
                    </span>
                    {s.fileCount !== undefined && s.fileCount > 0 && (
                      <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {s.fileCount}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};