import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import TopNav from './components/layout/TopNav.tsx';
import AuthControl from './components/auth/AuthControl.tsx';
import HomePage from './pages/HomePage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import PrivacyPage from './pages/PrivacyPage';
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
  const [stacks, setStacks] = useState<Stack[]>([]); 
  const [currentStackId, setCurrentStackId] = useState<string | null>(null);
  const { user, userInitial, signIn, signUp, signOut } = useAuth();

  const envApiUrl = (import.meta as any).env.VITE_API_URL;
  const apiUrl = envApiUrl || ((import.meta as any).env.DEV ? '/api' : 'http://127.0.0.1:8000');

  useEffect(() => {
    fetch(`${apiUrl}/stacks`)
      .then(res => res.json())
      .then(data => setStacks(data))
      .catch(err => console.error("Failed to fetch stacks", err));
  }, [apiUrl]);

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

  const currentStackLabel = useMemo(() => {
    const found = stacks.find((s) => s.id === currentStackId);
    return found?.type ?? '';
  }, [stacks, currentStackId]);

  const openWorkspace = (stackId: string | null = null) => {
    setCurrentStackId(stackId);
    navigate(stackId ? `/workspace/${encodeURIComponent(stackId)}` : '/workspace');
  };

  // create Stack
  const createStack = async (payload?: { name?: string; label?: string }) => {
    try {
      const res = await fetch(`${apiUrl}/stacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload?.name, label: payload?.label })
      });
      const newStack = await res.json();
      setStacks(prev => [newStack, ...prev]);
    } catch (err) {
      console.error("Create stack failed", err);
    }
  };

  // update Stack
  const updateStack = async (id: string, payload?: { name?: string; label?: string }) => {
    try {
      const res = await fetch(`${apiUrl}/stacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payload?.name, label: payload?.label })
      });
      const updated = await res.json();
      setStacks((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error("Update stack failed", err);
    }
  };

  // --- delete Stack ---
  const deleteStack = async (id: string) => {
    try {
      await fetch(`${apiUrl}/stacks/${id}`, { method: 'DELETE' });
      setStacks((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete stack failed", err);
    }
  };

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
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route
            path="/archives"
            element={<StacksPage stacks={stacks} onCreateStack={createStack} onUpdateStack={updateStack} onDeleteStack={deleteStack} onOpenStack={openWorkspace} />}
          />
          <Route path="/workspace" element={<WorkspacePage currentStackLabel={currentStackLabel} />} />
          <Route path="/workspace/:stackId" element={<WorkspacePage currentStackLabel={currentStackLabel} />} />
        </Routes>
      </main>
    </div>
  );
}
