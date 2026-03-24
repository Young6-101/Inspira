import { Sidebar } from "./components/SideBar";
import MainView from "./components/MainView";
import { useStacks } from "./hooks/useStack";
import { LoginPage } from "./components/LoginPage";

export default function App() {

  const { stacks, addStack } = useStacks();

  return (
    <LoginPage>
      <div className="flex h-screen w-full bg-[#f3eced] overflow-hidden">

        <Sidebar stacks={stacks} />

        <main className="flex-1 relative">
          <MainView stacks={stacks} onAddStack={addStack} />
        </main>

      </div>
    </LoginPage>
  );
}