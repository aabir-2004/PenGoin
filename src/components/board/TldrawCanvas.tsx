"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Tldraw,
  Editor,
  DefaultToolbar,
  DefaultToolbarContent,
  TLComponents,
  TLAssetStore,
  exportToBlob,
  TLShapeId,
} from "tldraw";
import { useSync } from "@tldraw/sync";
import { useNotesStore } from "@/store/useNotesStore";
import "tldraw/tldraw.css";

// Resolve WebSocket base URL once (outside component to avoid re-renders)
const WS_BASE =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
  (typeof window !== "undefined"
    ? `ws://${window.location.hostname}:1234`
    : "ws://localhost:1234");

// Bottom toolbar — same tools as default, position handled by CSS
function BottomToolbar() {
  return (
    <DefaultToolbar>
      <DefaultToolbarContent />
    </DefaultToolbar>
  );
}

// Memoized outside component so the reference is stable across renders
const COMPONENTS: TLComponents = {
  Toolbar: BottomToolbar,
};

// Simple passthrough asset store — no upload server needed for now
const ASSET_STORE: TLAssetStore = {
  upload: async () => ({ src: "" }),
  resolve: (asset) => {
    if ("src" in asset.props) return (asset.props.src as string | null) ?? "";
    return "";
  },
};

interface TldrawCanvasProps {
  roomId: string;
}

export default function TldrawCanvas({ roomId }: TldrawCanvasProps) {
  const { isReadOnly } = useNotesStore();
  const [isOffline, setIsOffline] = useState(false);

  const store = useSync({
    uri: `${WS_BASE}/connect/${roomId}`,
    assets: ASSET_STORE,
  });

  useEffect(() => {
    setIsOffline(store.status === "error");
  }, [store.status]);

  const handleMount = (editor: Editor) => {
    // Disable grid snapping — keep alignment guides only
    editor.updateInstanceState({ isGridMode: false });

    // Expose export to TopBar
    window.exportWhiteboard = async (format: "png" | "svg" = "png") => {
      const shapeIds = [...editor.getCurrentPageShapeIds()] as TLShapeId[];
      if (shapeIds.length === 0) {
        alert("Nothing to export!");
        return;
      }
      const blob = await exportToBlob({
        editor,
        ids: shapeIds,
        format: format === "svg" ? "svg" : "png",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pengoin-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return () => {
      delete window.exportWhiteboard;
    };
  };

  if (store.status === "loading") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#09090a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-[#9A9A9F] text-sm font-medium">
            Connecting to sync server...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      {isOffline && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium pointer-events-none">
          Offline mode — sync server unavailable
        </div>
      )}
      <Tldraw
        store={store.status === "synced-remote" ? store.store : undefined}
        onMount={handleMount}
        inferDarkMode
        components={COMPONENTS}
      />
    </div>
  );
}
