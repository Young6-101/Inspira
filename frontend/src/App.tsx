import { useState } from "react";
import { Sidebar } from "./components/SideBar";
import MainView from "./components/MainView";
import { useStacks } from "./hooks/useStack";
import { LoginPage } from "./components/LoginPage";

export default function App() {
  const { stacks, addStack, updateFileCount } = useStacks();
  const [activeStackId, setActiveStackId] = useState<string | null>(null);
  const [showManagement, setShowManagement] = useState(false);

  const handleAddStack = (name: string) => {
    const newId = addStack(name);
    setActiveStackId(newId);
    setShowManagement(false);
  };

  const handleSidebarClick = (id: string) => {
    setActiveStackId(id);
    setShowManagement(false);
  };

  const handleLogoClick = () => {
    setActiveStackId(null);
    setShowManagement(false);
  };

  const content = (
    <div className="flex h-full w-full bg-[#f3eced] overflow-hidden">
      <Sidebar stacks={stacks} activeStackId={activeStackId} onStackClick={handleSidebarClick} onLogoClick={handleLogoClick} />
      <main className="flex-1 relative overflow-hidden">
        <MainView
          stacks={stacks}
          onAddStack={handleAddStack}
          activeStackId={activeStackId}
          setActiveStackId={setActiveStackId}
          showManagement={showManagement}
          setShowManagement={setShowManagement}
          updateFileCount={updateFileCount}
        />
      </main>
    </div>
  );

  const shouldSkipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' || (import.meta.env.DEV && false);

  if (shouldSkipAuth) {
    return content;
  }

  return (
    <LoginPage>
      {content}
    </LoginPage>
  );
}
