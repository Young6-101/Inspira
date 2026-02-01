import { Provider } from "./provider"; 
import { Sidebar } from "./components/sidebar";
import MainView from "./components/mainview";

function App() {
  return (
    <Provider>
      {/* This is where the magic happens: flex layout to put them side-by-side */}
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
        
        {/* Component 1: Left */}
        <Sidebar />

        {/* Component 2: Right */}
        <main className="flex-1 overflow-y-auto">
          <MainView />
        </main>

      </div>
    </Provider>
  );
}

export default App;