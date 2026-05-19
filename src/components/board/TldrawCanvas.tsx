"use client";

import { useEffect } from "react";
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

// Resolve WebSocket URL:
// - NEXT_PUBLIC_WEBSOCKET_URL env var takes priority (set for production)
// - On localhost: ws://
// - On any other host: wss://
function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
    return process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  }
  if (typeof window === "undefined") return "ws://localhost:1234";
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const protocol = isLocal ? "ws" : "wss";
  const port = isLocal ? ":1234" : "";
  return `${protocol}://${window.location.hostname}${port}`;
}

const WS_BASE = getWsBase();

function BottomToolbar() {
  return (
    <DefaultToolbar>
      <DefaultToolbarContent />
    </DefaultToolbar>
  );
}

// Stable references outside component — prevents unnecessary re-renders
const COMPONENTS: TLComponents = { Toolbar: BottomToolbar };

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
  const store = useSync({
    uri: `${WS_BASE}/connect/${roomId}`,
    assets: ASSET_STORE,
  });

  const handleMount = (editor: Editor) => {
    editor.updateInstanceState({ isGridMode: false });

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

  if (store.status === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#09090a]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-400 text-sm font-medium">
            Could not connect to sync server
          </div>
          <div className="text-[#9A9A9F] text-xs max-w-xs text-center">
            Make sure the sync server is running at{" "}
            <code className="text-indigo-400">{WS_BASE}</code>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <Tldraw
        store={store.store}
        onMount={handleMount}
        inferDarkMode
        components={COMPONENTS}
      />
    </div>
  );
}
