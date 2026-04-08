import type { AuthUser } from '../../types/auth';

type AuthMenuProps = {
  user: AuthUser | null;
  isOpen: boolean;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onProfileClick: () => void;
  onSignOutClick: () => void;
};

export default function AuthMenu({ user, isOpen, onSignInClick, onSignUpClick, onProfileClick, onSignOutClick }: AuthMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 w-56 border-2 border-textBlack bg-white shadow-[6px_6px_0px_#111] p-3 z-50">
      {!user ? (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Account</p>
          <button onClick={onSignInClick} className="text-left border border-textBlack px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accentElectric/20">
            Log In
          </button>
          <button onClick={onSignUpClick} className="text-left border border-textBlack px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accentCoral/20">
            Sign Up
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Signed In</p>
          <div className="border border-textBlack px-3 py-2 bg-bgCream">
            <p className="text-xs font-bold uppercase tracking-widest">{user.nickname}</p>
            <p className="text-[10px] mt-1 text-gray-600 truncate">{user.email}</p>
          </div>
          <button onClick={onProfileClick} className="text-left border border-textBlack px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accentElectric/20">
            Profile
          </button>
          <button onClick={onSignOutClick} className="text-left border border-textBlack px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accentCoral/20">
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
