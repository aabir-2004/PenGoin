"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useNotesStore } from "@/store/useNotesStore";
import type { Editor } from "tldraw";

// Tldraw must be loaded client-side only
const TldrawCanvas = dynamic(
  () => import("./TldrawCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#09090a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-[#9A9A9F] text-sm font-medium">Loading canvas...</div>
        </div>
      </div>
    ),
  }
);

export default function Whiteboard() {
  const { activeNoteId } = useNotesStore();

  if (!activeNoteId) return null;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <TldrawCanvas key={activeNoteId} roomId={activeNoteId} />
    </div>
  );
}
