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

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    const message = text?.trim() || `HTTP ${res.status}`;
    throw new Error(message);
  }

  if (!text?.trim()) {
    throw new Error('Empty response body');
  }

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`Non-JSON response: ${text.slice(0, 120)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`);
  }
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [currentStackId, setCurrentStackId] = useState<string | null>(null);
  const { user, userInitial, signIn, signUp, signOut } = useAuth();

  const envApiUrl = (import.meta as any).env.VITE_API_URL;
  const apiUrl = envApiUrl || ((import.meta as any).env.DEV ? '/api' : 'http://127.0.0.1:8000');

  const fetchStacks = () => {
    // Mock fetching stacks
    setStacks(prev => prev.length > 0 ? prev : initialStacks);
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  useEffect(() => {
    if (location.pathname === '/archives' || location.pathname === '/') {
      fetchStacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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

  // create Stack (Mock)
  const createStack = async (payload?: { name?: string; label?: string }) => {
    const newStack: Stack = {
      id: Math.random().toString(36).substring(7),
      name: payload?.name || 'New Canvas',
      fileCount: 0,
      type: payload?.label || 'Unsorted'
    };
    setStacks(prev => [newStack, ...prev]);
  };

  // update Stack (Mock)
  const updateStack = async (id: string, payload?: { name?: string; label?: string }) => {
    setStacks((prev) => prev.map((s) => {
      if (s.id === id) {
        return { ...s, name: payload?.name || s.name, type: payload?.label || s.type };
      }
      return s;
    }));
  };

  // --- delete Stack (Mock) ---
  const deleteStack = async (id: string) => {
    setStacks((prev) => prev.filter((s) => s.id !== id));
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
