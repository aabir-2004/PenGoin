import Whiteboard from "@/components/board/Whiteboard";
import TopBar from "@/components/layout/TopBar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0F0F11] font-sans">
      <TopBar />
      <div className="flex-1 relative">
        <Whiteboard />
      </div>
    </div>
  );
}
