"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useNotesStore } from "@/store/useNotesStore";
import { useYjsStore } from "@/hooks/useYjsStore";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

// Excalidraw must be loaded client-side only (no SSR)
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

// Dynamically import export utilities  
const getExportUtils = () => import("@excalidraw/excalidraw");

export default function Whiteboard() {
  const { activeNoteId, isFollowingPresenter, isReadOnly } = useNotesStore();
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const isRemoteUpdateRef = useRef(false);

  const storeState = useYjsStore({
    roomId: activeNoteId || "default",
    hostUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
      (typeof window !== 'undefined' ? `ws://${window.location.hostname}:1234` : "ws://localhost:1234"),
  });

  // Subscribe to remote Yjs changes and push them into Excalidraw
  useEffect(() => {
    if (storeState.status !== 'synced' || !excalidrawAPI) return;

    const unsubscribe = storeState.onRemoteChange((elements) => {
      isRemoteUpdateRef.current = true;
      excalidrawAPI.updateScene({ elements });
      // Reset after a microtask to allow onChange to fire and be ignored
      queueMicrotask(() => { isRemoteUpdateRef.current = false; });
    });

    return unsubscribe;
  }, [storeState, excalidrawAPI]);

  // Push initial elements into Excalidraw once API is ready
  useEffect(() => {
    if (storeState.status !== 'synced' || !excalidrawAPI) return;
    if (storeState.initialElements.length > 0) {
      isRemoteUpdateRef.current = true;
      excalidrawAPI.updateScene({ elements: storeState.initialElements });
      queueMicrotask(() => { isRemoteUpdateRef.current = false; });
    }
  }, [storeState.status, excalidrawAPI]);

  // Handle local changes → push to Yjs
  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      if (storeState.status !== 'synced') return;
      // Don't echo remote changes back to Yjs
      if (isRemoteUpdateRef.current) return;
      storeState.pushElements(elements);
    },
    [storeState]
  );

  // === Presenter Logic ===
  const { setPresenterState } = useNotesStore();
  const [presenterId, setPresenterId] = useState<string | null>(null);

  useEffect(() => {
    if (storeState.status !== 'synced' || !storeState.yDoc) return;
    const yMeta = storeState.yDoc.getMap('meta');

    const handleMetaChange = () => {
      const pId = yMeta.get('presenterId') as string | undefined;
      setPresenterId(pId || null);
    };

    yMeta.observe(handleMetaChange);
    handleMetaChange();

    return () => yMeta.unobserve(handleMetaChange);
  }, [storeState.status, storeState.yDoc]);

  // Update presenter state in zustand
  useEffect(() => {
    const myId = typeof window !== 'undefined' ? (window as any).__pengoin_user_id : null;
    const amIPresenting = presenterId === myId;
    const isFollowing = !!presenterId && !amIPresenting;
    setPresenterState(amIPresenting, isFollowing);
  }, [presenterId, setPresenterState]);

  // Camera sync for presenter
  useEffect(() => {
    if (storeState.status !== 'synced' || !storeState.yDoc || !excalidrawAPI) return;
    const yMeta = storeState.yDoc.getMap('meta');
    const myId = typeof window !== 'undefined' ? (window as any).__pengoin_user_id : null;

    if (presenterId && presenterId !== myId) {
      // Follow presenter's scroll position
      const handleCameraChange = () => {
        const cam = yMeta.get('camera') as any;
        if (cam) {
          excalidrawAPI.scrollToContent(undefined as any, { fitToContent: false });
        }
      };
      yMeta.observe(handleCameraChange);
      return () => yMeta.unobserve(handleCameraChange);
    }
  }, [storeState, excalidrawAPI, presenterId]);

  // Expose toggle presenter to TopBar
  useEffect(() => {
    if (storeState.status !== 'synced' || !storeState.yDoc) return;
    
    // Generate a stable user ID for this session
    if (typeof window !== 'undefined' && !(window as any).__pengoin_user_id) {
      (window as any).__pengoin_user_id = crypto.randomUUID();
    }
    const myId = (window as any).__pengoin_user_id;

    (window as any).togglePresenter = () => {
      const yMeta = storeState.yDoc!.getMap('meta');
      const currentId = yMeta.get('presenterId');
      if (currentId === myId) {
        yMeta.set('presenterId', null);
      } else {
        yMeta.set('presenterId', myId);
      }
    };

    return () => { delete (window as any).togglePresenter; };
  }, [storeState]);

  // Expose export to TopBar
  useEffect(() => {
    if (!excalidrawAPI) return;

    (window as any).exportWhiteboard = async (format: 'png' | 'svg' = 'png') => {
      try {
        const { exportToBlob, exportToSvg } = await getExportUtils();
        const elements = excalidrawAPI.getSceneElements();
        if (elements.length === 0) {
          alert("Nothing to export!");
          return;
        }

        if (format === 'svg') {
          const svg = await exportToSvg({
            elements,
            appState: excalidrawAPI.getAppState(),
            files: excalidrawAPI.getFiles(),
          });
          const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pengoin-export.svg';
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const blob = await exportToBlob({
            elements,
            appState: excalidrawAPI.getAppState(),
            files: excalidrawAPI.getFiles(),
            mimeType: 'image/png',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pengoin-export.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error("Export failed", e);
        alert("Export failed. See console.");
      }
    };

    return () => { delete (window as any).exportWhiteboard; };
  }, [excalidrawAPI]);

  // === Render ===
  if (!activeNoteId) return null;

  if (storeState.status === "loading") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0F0F11]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-[#9A9A9F] text-sm font-medium">Connecting to realtime sync server...</div>
        </div>
      </div>
    );
  }

  const effectivelyReadOnly = isReadOnly || isFollowingPresenter;

  return (
    <div 
      style={{ position: "absolute", inset: 0 }} 
      className={isFollowingPresenter ? "pointer-events-none" : ""}
    >
      <Excalidraw
        key={activeNoteId}
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
        onChange={handleChange}
        theme="dark"
        gridModeEnabled={true}
        viewModeEnabled={effectivelyReadOnly}
        initialData={{
          appState: {
            theme: "dark",
            gridSize: 20,
            viewBackgroundColor: "#0F0F11",
          },
        }}
      />
    </div>
  );
}
