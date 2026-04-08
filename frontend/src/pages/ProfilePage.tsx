import type { AuthUser } from '../types/auth';

type ProfilePageProps = {
  user: AuthUser | null;
};

export default function ProfilePage({ user }: ProfilePageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-12">
      <header className="border-b-2 border-textBlack pb-6 mb-8">
        <h1 className="text-7xl md:text-8xl font-display uppercase leading-none">Profile</h1>
        <p className="mt-4 text-sm font-medium border-l-2 border-textBlack pl-4 max-w-md">
          Account details from Cognito session.
        </p>
      </header>

      {!user ? (
        <div className="border-2 border-textBlack bg-white p-6 shadow-[6px_6px_0px_#111] max-w-xl">
          <p className="text-sm font-bold uppercase tracking-widest">Not logged in</p>
          <p className="text-sm mt-2 text-gray-600">Use the avatar button in the top-right to log in or sign up.</p>
        </div>
      ) : (
        <div className="border-2 border-textBlack bg-white p-6 shadow-[6px_6px_0px_#111] max-w-xl space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nickname</p>
            <p className="text-xl font-bold">{user.nickname}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</p>
            <p className="text-base font-medium">{user.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
