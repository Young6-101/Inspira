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

  const buildContent = (userEmail?: string, onSignOut?: () => void) => (
    <div className="fixed inset-0 flex min-w-0 min-h-0 bg-[#f3eced] overflow-hidden p-4 gap-4 box-border font-sans">
      <Sidebar
        stacks={stacks}
        activeStackId={activeStackId}
        onStackClick={handleSidebarClick}
        onLogoClick={handleLogoClick}
        userEmail={userEmail}
        onSignOut={onSignOut}
        onModifyProfile={() => {
          console.log("Modify profile clicked");
        }}
      />
      <main className="flex-1 min-w-0 min-h-0 relative overflow-hidden bg-[#f7f2f3] rounded-2xl">
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
    return buildContent();
  }

  return (
    <LoginPage>
      {({ userEmail, signOut }) => buildContent(userEmail, signOut)}
    </LoginPage>
  );
}
