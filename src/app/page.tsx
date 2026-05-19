import Whiteboard from "@/components/board/Whiteboard";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function Home() {
  return (
    <div className="min-h-screen w-screen overflow-hidden bg-[#070708] px-3 py-3 text-white">
      <div className="flex h-[calc(100vh-24px)] w-full overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_32%),linear-gradient(180deg,_#121213_0%,_#09090A_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <Sidebar />
        <div className="relative flex h-full flex-1 flex-col">
          <TopBar />
          <div className="relative flex-1 px-5 pb-5">
            <Whiteboard />
          </div>
        </div>
      </div>
    </div>
  );
}
