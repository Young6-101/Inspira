import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import TopNav from './components/layout/TopNav.tsx';
import AuthControl from './components/auth/AuthControl.tsx';
import HomePage from './pages/HomePage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import StacksPage from './pages/StacksPage.tsx';
import WorkspacePage from './pages/WorkspacePage.tsx';
import useAuth from './hooks/useAuth';

type Stack = {
  id: string;
  name: string;
  fileCount: number;
  type: string;
};

const initialStacks: Stack[] = [
  { id: '1', name: 'Typography Grid', fileCount: 12, type: 'Layout' },
  { id: '2', name: 'Industrial Textures', fileCount: 28, type: 'Assets' },
  { id: '3', name: 'Navigation Logic', fileCount: 4, type: 'UX' },
  { id: '4', name: 'Color Mono', fileCount: 7, type: 'Style' },
  { id: '5', name: 'Raw Dump', fileCount: 84, type: 'Unsorted' }
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stacks, setStacks] = useState<Stack[]>(initialStacks);
  const [currentStackId, setCurrentStackId] = useState<string | null>(null);
  const { user, userInitial, signIn, signUp, signOut } = useAuth();

  const inWorkspace = location.pathname.startsWith('/workspace');

  useEffect(() => {
    const match = location.pathname.match(/^\/workspace\/([^/]+)/);
    if (match?.[1]) {
      setCurrentStackId(decodeURIComponent(match[1]));
    }
  }, [location.pathname]);

  const currentStackName = useMemo(() => {
    const found = stacks.find((s) => s.id === currentStackId);
    return found?.name ?? 'New Canvas';
  }, [stacks, currentStackId]);

  const openWorkspace = (stackId: string | null = null) => {
    setCurrentStackId(stackId);
    navigate(stackId ? `/workspace/${encodeURIComponent(stackId)}` : '/workspace');
  };

  const createStack = (payload?: { name?: string; label?: string }) => {
    setStacks((prev) => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');

      const newId = `${yyyy}/${mm}/${dd}`;
      const fallbackName = 'Untitled';
      const fallbackLabel = 'Unsorted';

      const next: Stack = {
        id: newId,
        name: payload?.name?.trim() || fallbackName,
        fileCount: 0,
        type: payload?.label?.trim() || fallbackLabel
      };

      return [next, ...prev];
    });
  };

  const updateStack = (id: string, payload?: { name?: string; label?: string }) => {
    setStacks((prev) => prev.map((stack) => {
      if (stack.id !== id) return stack;
      return {
        ...stack,
        name: payload?.name?.trim() || 'Untitled',
        type: payload?.label?.trim() || 'Unsorted'
      };
    }));
  };

  const deleteStack = (id: string) => setStacks((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="h-screen w-screen bg-bgCream text-textBlack font-sansAlt flex flex-col overflow-hidden grid-bg">
      <TopNav
        inWorkspace={inWorkspace}
        currentStackName={currentStackName}
        onHome={() => navigate('/')}
        onArchives={() => navigate('/archives')}
        onWorkspace={() => openWorkspace(currentStackId)}
        authControl={(
          <AuthControl
            user={user}
            avatarLabel={user ? userInitial : 'S'}
            onSignIn={signIn}
            onSignUp={signUp}
            onProfile={() => navigate('/profile')}
            onSignOut={signOut}
          />
        )}
      />
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage onOpenArchives={() => navigate('/archives')} onOpenWorkspace={() => openWorkspace()} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route
            path="/archives"
            element={<StacksPage stacks={stacks} onCreateStack={createStack} onUpdateStack={updateStack} onDeleteStack={deleteStack} onOpenStack={openWorkspace} />}
          />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/workspace/:stackId" element={<WorkspacePage />} />
        </Routes>
      </main>
    </div>
  );
}
