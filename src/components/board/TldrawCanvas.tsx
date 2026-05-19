"use client";

import { useCallback, useRef } from "react";
import {
  Tldraw,
  Editor,
  DefaultToolbar,
  DefaultToolbarContent,
  TLComponents,
  TLAssetStore,
  TLUiOverrides,
  exportToBlob,
  TLShapeId,
  useEditor,
  track,
  DefaultSizeStyle,
  TLDefaultSizeStyle,
} from "tldraw";
import { useSync } from "@tldraw/sync";
import { useNotesStore } from "@/store/useNotesStore";
import Sidebar from "@/components/layout/Sidebar";
import "tldraw/tldraw.css";

// ─── WebSocket URL ────────────────────────────────────────────────────────────
function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
    return process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  }
  if (typeof window === "undefined") return "ws://localhost:1234";
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  return isLocal
    ? `ws://${window.location.hostname}:1234`
    : `wss://${window.location.hostname}`;
}
const WS_BASE = getWsBase();

// ─── Asset store ─────────────────────────────────────────────────────────────
const ASSET_STORE: TLAssetStore = {
  upload: async () => ({ src: "" }),
  resolve: (asset) => {
    if ("src" in asset.props) return (asset.props.src as string | null) ?? "";
    return "";
  },
};

// ─── Size label → tldraw size mapping ────────────────────────────────────────
// Maps a 0-100 slider value to one of tldraw's four size buckets
function sliderToSize(v: number): TLDefaultSizeStyle {
  if (v < 25) return "s";
  if (v < 50) return "m";
  if (v < 75) return "l";
  return "xl";
}
function sizeToSlider(s: TLDefaultSizeStyle): number {
  return { s: 12, m: 37, l: 62, xl: 87 }[s];
}

// ─── Font size slider component ───────────────────────────────────────────────
const FontSizeSlider = track(function FontSizeSlider() {
  const editor = useEditor();
  const currentSize =
    (editor.getStyleForNextShape(DefaultSizeStyle) as TLDefaultSizeStyle) ??
    "m";
  const sliderValue = sizeToSlider(currentSize);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    const size = sliderToSize(v);
    editor.setStyleForNextShapes(DefaultSizeStyle, size);
    editor.setStyleForSelectedShapes(DefaultSizeStyle, size);
  };

  return (
    <div className="flex items-center gap-2 px-2">
      <span className="text-[10px] text-[#9A9A9F] w-3">A</span>
      <input
        type="range"
        min={0}
        max={100}
        value={sliderValue}
        onChange={handleChange}
        className="w-20 h-1 accent-indigo-500 cursor-pointer"
        title={`Size: ${currentSize.toUpperCase()} (${sliderValue})`}
      />
      <span className="text-[13px] text-[#9A9A9F]">A</span>
    </div>
  );
});

// ─── Page navigation component ────────────────────────────────────────────────
const PageNav = track(function PageNav() {
  const editor = useEditor();
  const pages = editor.getPages();
  const current = editor.getCurrentPage();
  const idx = pages.findIndex((p) => p.id === current.id);

  const prev = () => {
    if (idx > 0) editor.setCurrentPage(pages[idx - 1]);
  };
  const next = () => {
    if (idx < pages.length - 1) {
      editor.setCurrentPage(pages[idx + 1]);
    } else {
      // Add a new page — createPage automatically navigates to it
      editor.createPage({ name: `Page ${pages.length + 1}` });
    }
  };

  return (
    <div className="flex items-center gap-1 px-1 border-l border-[#2e2e33] ml-1">
      <button
        type="button"
        onClick={prev}
        disabled={idx === 0}
        title="Previous page"
        className="w-7 h-7 flex items-center justify-center rounded text-[#9A9A9F] hover:bg-[#2a2a30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
      >
        ‹
      </button>
      <span className="text-[10px] text-[#9A9A9F] min-w-[36px] text-center">
        {idx + 1} / {pages.length}
      </span>
      <button
        type="button"
        onClick={next}
        title={idx < pages.length - 1 ? "Next page" : "Add page"}
        className="w-7 h-7 flex items-center justify-center rounded text-[#9A9A9F] hover:bg-[#2a2a30] transition-colors text-sm"
      >
        {idx < pages.length - 1 ? "›" : "+"}
      </button>
    </div>
  );
});

// ─── Custom toolbar ───────────────────────────────────────────────────────────
function CustomToolbar() {
  return (
    <DefaultToolbar>
      <DefaultToolbarContent />
      <FontSizeSlider />
      <PageNav />
    </DefaultToolbar>
  );
}

// ─── AI assist for draw strokes ───────────────────────────────────────────────
// When a freehand draw stroke is completed, optionally call an AI endpoint
// to recognise the shape and replace it with a clean tldraw shape.
// This is a best-effort feature — if the API is unavailable it silently skips.
async function recogniseStroke(
  editor: Editor,
  shapeId: TLShapeId
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) return; // AI assist disabled if no key

  try {
    // Export just this shape as a small PNG for recognition
    const blob = await exportToBlob({
      editor,
      ids: [shapeId],
      format: "png",
      opts: { scale: 0.5 },
    });

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(blob);
    });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64}`, detail: "low" },
              },
              {
                type: "text",
                text: 'What shape is drawn? Reply with exactly one word: "rectangle", "ellipse", "triangle", "arrow", "line", or "none".',
              },
            ],
          },
        ],
      }),
    });

    const json = await res.json();
    const answer = (json.choices?.[0]?.message?.content ?? "none")
      .trim()
      .toLowerCase();

    // Map recognised shape to a tldraw geo shape
    const geoMap: Record<string, string> = {
      rectangle: "rectangle",
      ellipse: "ellipse",
      triangle: "triangle",
    };

    if (geoMap[answer]) {
      const shape = editor.getShape(shapeId);
      if (!shape) return;
      const bounds = editor.getShapePageBounds(shapeId);
      if (!bounds) return;

      editor.batch(() => {
        editor.deleteShape(shapeId);
        editor.createShape({
          type: "geo",
          x: bounds.x,
          y: bounds.y,
          props: {
            geo: geoMap[answer],
            w: bounds.w,
            h: bounds.h,
          },
        });
      });
    }
  } catch {
    // Silently ignore — AI assist is best-effort
  }
}

// ─── Stable component map ─────────────────────────────────────────────────────
const COMPONENTS: TLComponents = {
  Toolbar: CustomToolbar,
  // Render our sidebar inside the tldraw context so useEditor() works
  InFrontOfTheCanvas: track(function InFrontOfTheCanvas() {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 300,
          pointerEvents: "auto",
        }}
      >
        <Sidebar />
      </div>
    );
  }),
};

// ─── Main canvas component ────────────────────────────────────────────────────
interface TldrawCanvasProps {
  roomId: string;
}

export default function TldrawCanvas({ roomId }: TldrawCanvasProps) {
  const store = useSync({
    uri: `${WS_BASE}/connect/${roomId}`,
    assets: ASSET_STORE,
  });

  const handleMount = useCallback((editor: Editor) => {
    editor.updateInstanceState({ isGridMode: false });

    // AI assist — listen for completed draw shapes
    const unsubscribe = editor.store.listen(
      (entry) => {
        if (entry.source !== "user") return;
        for (const record of Object.values(entry.changes.added)) {
          if (
            record.typeName === "shape" &&
            (record as { type: string }).type === "draw"
          ) {
            // Small delay so the stroke is fully committed
            setTimeout(() => {
              recogniseStroke(editor, record.id as TLShapeId);
            }, 300);
          }
        }
      },
      { source: "user", scope: "document" }
    );

    // Export handler — supports png, svg, pdf (pdf = all pages as images)
    window.exportWhiteboard = async (format: "png" | "svg" | "pdf" = "png") => {
      if (format === "pdf") {
        // Export each page as PNG and combine into a PDF via browser print
        const pages = editor.getPages();
        const images: string[] = [];

        for (const page of pages) {
          editor.setCurrentPage(page);
          await new Promise((r) => setTimeout(r, 100)); // let canvas settle
          const ids = [...editor.getCurrentPageShapeIds()] as TLShapeId[];
          if (ids.length === 0) continue;
          const blob = await exportToBlob({ editor, ids, format: "png" });
          const url = URL.createObjectURL(blob);
          images.push(url);
        }

        if (images.length === 0) {
          alert("Nothing to export!");
          return;
        }

        // Open a print window with all page images
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
          <html><head><title>PenGoin Export</title>
          <style>
            body { margin: 0; }
            img { width: 100%; page-break-after: always; display: block; }
            img:last-child { page-break-after: avoid; }
          </style></head><body>
          ${images.map((u) => `<img src="${u}" />`).join("")}
          <script>window.onload = () => { window.print(); }<\/script>
          </body></html>
        `);
        win.document.close();
        return;
      }

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
      unsubscribe();
      delete window.exportWhiteboard;
    };
  }, []);

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
            Server: <code className="text-indigo-400">{WS_BASE}</code>
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
