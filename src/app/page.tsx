import Whiteboard from "@/components/board/Whiteboard";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F0F11] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative">
        <TopBar />
        <div className="flex-1 relative">
           <Whiteboard />
        </div>
      </div>
    </div>
  );
}

