import { useEffect, useRef, useState } from "react";

interface UserAvatarMenuProps {
  userEmail?: string;
  onSignOut?: () => void;
  onModifyProfile?: () => void;
}

export const UserAvatarMenu = ({
  userEmail,
  onSignOut,
  onModifyProfile,
}: UserAvatarMenuProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = userEmail?.trim() || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative mt-auto pt-4 border-t border-[#e6dadd]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-11 h-11 rounded-full bg-[#0a86ce] text-white font-bold flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
        aria-label="Open user menu"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute left-0 bottom-14 w-56 rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm text-gray-700 truncate">{displayName}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onModifyProfile?.();
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Modify profile
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut?.();
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
