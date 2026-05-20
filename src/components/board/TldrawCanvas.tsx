"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Tldraw,
  Editor,
  DefaultToolbar,
  TLComponents,
  TLAssetStore,
  exportToBlob,
  TLPageId,
  TLShapeId,
  useEditor,
  useValue,
  track,
  DefaultSizeStyle,
  SelectToolbarItem,
  HandToolbarItem,
  DrawToolbarItem,
  LaserToolbarItem,
  EraserToolbarItem,
  ArrowToolbarItem,
  TextToolbarItem,
  NoteToolbarItem,
  AssetToolbarItem,
  RectangleToolbarItem,
  EllipseToolbarItem,
  DiamondToolbarItem,
  TriangleToolbarItem,
  HexagonToolbarItem,
  OvalToolbarItem,
  RhombusToolbarItem,
  StarToolbarItem,
  CloudToolbarItem,
  HeartToolbarItem,
  XBoxToolbarItem,
  CheckBoxToolbarItem,
  ArrowLeftToolbarItem,
  ArrowUpToolbarItem,
  ArrowDownToolbarItem,
  ArrowRightToolbarItem,
  LineToolbarItem,
  HighlightToolbarItem,
  FrameToolbarItem,
} from "tldraw";
import { useSync } from "@tldraw/sync";
import { useNotesStore } from "@/store/useNotesStore";
import Sidebar from "@/components/layout/Sidebar";
import CustomStylePanel from "@/components/board/CustomStylePanel";
import {
  getPresentationStateFromMeta,
  withPresentationState,
} from "@/components/board/presentation";
import { getMappedTextSize } from "@/components/board/textStyles";
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

// ─── Page navigation component ────────────────────────────────────────────────
const PageNav = track(function PageNav() {
  const editor = useEditor();
  const isReadOnly = useNotesStore((s) => s.isReadOnly);
  const pages = editor.getPages();
  const current = editor.getCurrentPage();
  const idx = pages.findIndex((p) => p.id === current.id);

  const prev = () => {
    if (idx > 0) editor.setCurrentPage(pages[idx - 1]);
  };
  const next = () => {
    if (idx < pages.length - 1) {
      editor.setCurrentPage(pages[idx + 1]);
    } else if (!isReadOnly) {
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
        disabled={idx === pages.length - 1 && isReadOnly}
        className="w-7 h-7 flex items-center justify-center rounded text-[#9A9A9F] hover:bg-[#2a2a30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {idx < pages.length - 1 ? "›" : "+"}
      </button>
    </div>
  );
});

// ─── Custom toolbar ───────────────────────────────────────────────────────────
interface CustomToolbarProps {
  isReadOnly: boolean;
}

function CustomToolbar({ isReadOnly }: CustomToolbarProps) {
  return (
    <DefaultToolbar>
      {!isReadOnly && (
        <>
          <SelectToolbarItem />
          <HandToolbarItem />
          <DrawToolbarItem />
          <LaserToolbarItem />
          <EraserToolbarItem />
          <ArrowToolbarItem />
          <TextToolbarItem />
          <NoteToolbarItem />
          <AssetToolbarItem />
          <RectangleToolbarItem />
          <EllipseToolbarItem />
          <TriangleToolbarItem />
          <DiamondToolbarItem />
          <HexagonToolbarItem />
          <OvalToolbarItem />
          <RhombusToolbarItem />
          <StarToolbarItem />
          <CloudToolbarItem />
          <HeartToolbarItem />
          <XBoxToolbarItem />
          <CheckBoxToolbarItem />
          <ArrowLeftToolbarItem />
          <ArrowUpToolbarItem />
          <ArrowDownToolbarItem />
          <ArrowRightToolbarItem />
          <LineToolbarItem />
          <HighlightToolbarItem />
          <FrameToolbarItem />
        </>
      )}
      <PageNav />
    </DefaultToolbar>
  );
}

const PresentationViewOverlay = track(function PresentationViewOverlay() {
  const isPresentationView = useNotesStore((s) => s.isPresentationView);
  const setPresentationView = useNotesStore((s) => s.setPresentationView);
  const presentationState = useNotesStore((s) => s.presentationState);

  if (!isPresentationView) return null;

  return (
    <div className="absolute top-4 right-4 z-[500] flex items-center gap-2 pointer-events-auto">
      <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
        {presentationState.active
          ? presentationState.isScreenLocked
            ? "Presentation Locked"
            : "Presentation Unlocked"
          : "Presentation View"}
      </div>
      <button
        type="button"
        onClick={() => setPresentationView(false)}
        className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-black/75 transition-colors"
      >
        Exit View
      </button>
    </div>
  );
});

const PresentationSync = track(function PresentationSync() {
  const editor = useEditor();
  const deviceId = useNotesStore((s) => s.deviceId);
  const isPresentationView = useNotesStore((s) => s.isPresentationView);
  const setPresentationState = useNotesStore((s) => s.setPresentationState);
  const currentPageId = useValue(
    "presentation-current-page-id",
    () => editor.getCurrentPageId(),
    [editor]
  );
  const documentMeta = useValue(
    "presentation-document-meta",
    () => editor.getDocumentSettings().meta,
    [editor]
  );
  const presentationState = getPresentationStateFromMeta(documentMeta);
  const isPresenter =
    presentationState.active && presentationState.presenterId === deviceId;

  useEffect(() => {
    setPresentationState(presentationState);
  }, [presentationState, setPresentationState]);

  useEffect(() => {
    if (!isPresenter) return;
    if (presentationState.currentPageId === currentPageId) return;

    editor.updateDocumentSettings({
      meta: withPresentationState(documentMeta as Record<string, unknown>, {
        ...presentationState,
        currentPageId,
      }),
    });
  }, [currentPageId, documentMeta, editor, isPresenter, presentationState]);

  useEffect(() => {
    if (!isPresentationView) return;
    if (!presentationState.active) return;
    if (!presentationState.currentPageId) return;
    if (presentationState.currentPageId === currentPageId) return;

    editor.setCurrentPage(presentationState.currentPageId as TLPageId);
  }, [currentPageId, editor, isPresentationView, presentationState]);

  useEffect(() => {
    const controls = {
      startPresenting: () => {
        const nextState = {
          ...presentationState,
          active: true,
          presenterId: deviceId,
          currentPageId,
        };
        editor.updateDocumentSettings({
          meta: withPresentationState(
            editor.getDocumentSettings().meta as Record<string, unknown>,
            nextState
          ),
        });
      },
      stopPresenting: () => {
        if (!isPresenter) return;
        editor.updateDocumentSettings({
          meta: withPresentationState(
            editor.getDocumentSettings().meta as Record<string, unknown>,
            {
              ...presentationState,
              active: false,
              presenterId: null,
            }
          ),
        });
      },
      togglePresentationLock: () => {
        editor.updateDocumentSettings({
          meta: withPresentationState(
            editor.getDocumentSettings().meta as Record<string, unknown>,
            {
              ...presentationState,
              active: true,
              presenterId: presentationState.presenterId ?? deviceId,
              currentPageId: presentationState.currentPageId ?? currentPageId,
              isScreenLocked: !presentationState.isScreenLocked,
            }
          ),
        });
      },
      setPreferredTextSize: (value: number) => {
        const mapped = getMappedTextSize(value);
        const updates = editor
          .getSelectedShapes()
          .filter((shape) => shape.type === "text")
          .map((shape) => ({
            id: shape.id,
            type: "text" as const,
            props: {
              size: mapped.size,
              scale: mapped.scale,
            },
          }));

        editor.setStyleForNextShapes(DefaultSizeStyle, mapped.size);
        if (updates.length > 0) {
          editor.updateShapes(updates);
        }
      },
    };

    window.presentationControls = controls;
    return () => {
      delete window.presentationControls;
    };
  }, [
    currentPageId,
    deviceId,
    editor,
    isPresenter,
    presentationState,
  ]);

  return <PresentationViewOverlay />;
});

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

// ─── Main canvas component ────────────────────────────────────────────────────
interface TldrawCanvasProps {
  roomId: string;
}

export default function TldrawCanvas({ roomId }: TldrawCanvasProps) {
  const isReadOnly = useNotesStore((s) => s.isReadOnly);
  const preferredTextSize = useNotesStore((s) => s.preferredTextSize);
  const isPresentationView = useNotesStore((s) => s.isPresentationView);
  const presentationState = useNotesStore((s) => s.presentationState);
  const isReadOnlyRef = useRef(isReadOnly);
  const pendingTextSizeRef = useRef(preferredTextSize);

  const store = useSync({
    uri: `${WS_BASE}/connect/${roomId}`,
    assets: ASSET_STORE,
  });

  useEffect(() => {
    isReadOnlyRef.current = isReadOnly;
  }, [isReadOnly]);

  useEffect(() => {
    pendingTextSizeRef.current = preferredTextSize;
  }, [preferredTextSize]);

  const components = useMemo<TLComponents>(
    () => ({
      Toolbar: () => <CustomToolbar isReadOnly={isReadOnly} />,
      StylePanel: isPresentationView ? null : CustomStylePanel,
      // Render our sidebar inside the tldraw context so useEditor() works
      InFrontOfTheCanvas: track(function InFrontOfTheCanvas() {
        return (
          <>
            {!isPresentationView && (
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
            )}
            <PresentationSync />
          </>
        );
      }),
    }),
    [isPresentationView, isReadOnly]
  );

  const handleMount = useCallback((editor: Editor) => {
    (window as typeof window & { __pengoinEditor?: Editor }).__pengoinEditor =
      editor;
    editor.updateInstanceState({ isGridMode: false });
    editor.setCurrentTool(isReadOnlyRef.current ? "hand" : "select");

    // AI assist — listen for completed draw shapes
    const unsubscribe = editor.store.listen(
      (entry) => {
        if (entry.source !== "user") return;
        for (const record of Object.values(entry.changes.added)) {
          if (
            (record as { type?: string }).type === "text" &&
            pendingTextSizeRef.current
          ) {
            const mapped = getMappedTextSize(pendingTextSizeRef.current);
            editor.updateShapes([
              {
                id: record.id as TLShapeId,
                type: "text",
                props: {
                  size: mapped.size,
                  scale: mapped.scale,
                },
              },
            ]);
          }

          if (isReadOnlyRef.current) continue;
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
      delete (window as typeof window & { __pengoinEditor?: Editor })
        .__pengoinEditor;
    };
  }, []);

  const editorRef = useRef<Editor | null>(null);

  const handleEditorMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      return handleMount(editor);
    },
    [handleMount]
  );

  useEffect(() => {
    if (!editorRef.current) return;
    const shouldLockCanvas =
      isReadOnly || (isPresentationView && presentationState.isScreenLocked);
    
    // Natively set read-only state so panning and pinch-zooming are fully enabled
    // on touch devices, while preventing any modifications or additions.
    editorRef.current.updateInstanceState({ isReadonly: shouldLockCanvas });
    
    editorRef.current.setCurrentTool(shouldLockCanvas ? "hand" : "select");
    if (shouldLockCanvas) {
      editorRef.current.blur({ blurContainer: true });
    }
  }, [isPresentationView, isReadOnly, presentationState.isScreenLocked]);

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
    <div className="absolute inset-0 w-full h-full" style={{ touchAction: "none" }}>
      <div
        className="absolute inset-0 z-[250] pointer-events-none"
        style={{
          left: isPresentationView ? 0 : "var(--sidebar-width)",
          bottom: isPresentationView ? 0 : 72,
          top: 0,
        }}
      />
      <Tldraw
        store={store.store}
        onMount={handleEditorMount}
        inferDarkMode
        components={components}
        hideUi={isPresentationView}
      />
    </div>
  );
}
