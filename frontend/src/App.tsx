import { Sidebar } from "./components/SideBar";
import MainView from "./components/MainView";
import { useStacks } from "./hooks/useStack";

export default function App() {
  // 1. 调用 Hook 获取数据和操作方法
  const { stacks, addStack } = useStacks();

  return (
    /**
     * 布局说明：
     * flex: 左右布局
     * h-screen: 强制填满屏幕高度
     * overflow-hidden: 关键！防止浏览器出现双滚动条，把滚动权完全交给 3D 引擎
     * bg-[#f3eced]: 统一背景色
     */
    <div className="flex h-screen w-full bg-[#f3eced] overflow-hidden">
      
      {/* 2. 左侧边栏：传入 stacks 实时显示列表 */}
      <Sidebar stacks={stacks} />

      {/* 3. 右侧主区域 */}
      <main className="flex-1 relative">
        <MainView stacks={stacks} onAddStack={addStack} />
      </main>

    </div>
  );
}