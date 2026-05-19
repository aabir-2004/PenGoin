"use client";

import { Tldraw, useEditor, useValue, TLTextShape, createShapeId } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState } from "react";
import { useNotesStore } from "@/store/useNotesStore";


// Hook to apply custom logic and markdown shortcuts
function PenGoinLogic() {
  const editor = useEditor();

  useEffect(() => {
    // 1. Blackboard (Dark Mode) + Grid Mode
    editor.user.updateUserPreferences({ colorScheme: "dark" });
    editor.updateInstanceState({ isGridMode: true });

    // 2. Markdown Shortcuts
    const cleanup = editor.store.listen((change) => {
      const updated = change.changes.updated;
      for (const record of Object.values(updated)) {
        const next = record[1] as any;

        if (next.typeName === "shape" && next.type === "text") {
          // If shape is marked to ignore markdown, skip scaling
          if (next.meta?.ignoreMarkdown) continue;

          const util = editor.getShapeUtil(next);
          const nextText = (util as any).getText(next) as string;

          let newScale = 1; // Default
          let isHeading = false;

          // Slash Command: Equation block
          if (nextText === "/math ") {
             editor.deleteShape(next.id);
             const newId = createShapeId();
             editor.createShape({
                 id: newId,
                 type: "math",
                 x: next.x,
                 y: next.y,
                 props: { equation: "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" }
             } as any);
             editor.setEditingShape(newId);
             editor.select(newId);
             continue; 
          }

          // Slash Command: Code block
          if (nextText === "/code ") {
             editor.deleteShape(next.id);
             const newId = createShapeId();
             editor.createShape({
                 id: newId,
                 type: "code",
                 x: next.x,
                 y: next.y,
                 props: { code: "function helloWorld() {\n  console.log('Hello from PenGoin!');\n}", language: "javascript" }
             } as any);
             editor.setEditingShape(newId);
             editor.select(newId);
             continue; 
          }

          const h1Match = nextText.match(/^#\s*(.*)/);
          const h2Match = nextText.match(/^##\s*(.*)/);
          const h3Match = nextText.match(/^###\s*(.*)/);

          if (h3Match) {
            newScale = 1.3; // h3
            isHeading = true;
          } else if (h2Match) {
            newScale = 1.8; // h2
            isHeading = true;
          } else if (h1Match) {
            newScale = 2.5; // h1
            isHeading = true;
          }

          const currentScale = next.props.scale ?? 1;

          if (isHeading && currentScale !== newScale) {
            editor.updateShape({
              id: next.id,
              type: "text",
              props: { scale: newScale },
            });
          }
        }
      }
    });

    // 3. Handle Backspace at index 0 to remove heading format
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        const activeEl = document.activeElement as HTMLTextAreaElement;
        // Check if editing a textarea and cursor is at the very beginning
        if (activeEl && activeEl.tagName === "TEXTAREA") {
          if (activeEl.selectionStart === 0 && activeEl.selectionEnd === 0) {
            const editingId = editor.getEditingShapeId();
            if (editingId) {
              const shape = editor.getShape(editingId) as any;
              if (shape && shape.type === "text") {
                const currentScale = shape.props.scale ?? 1;
                if (currentScale > 1) {
                  // Revert to normal text but keep the # text
                  editor.updateShape({
                    id: shape.id,
                    type: "text",
                    props: { scale: 1 },
                    meta: { ...shape.meta, ignoreMarkdown: true },
                  });
                  // Prevent the browser from doing anything else with this backspace
                  e.stopPropagation();
                  e.preventDefault();
                }
              }
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      cleanup();
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [editor]);

  return null;
}

// Custom UI overlay for precise text sizing
function TextSizeDropdown() {
  const editor = useEditor();
  const { isFollowingPresenter } = useNotesStore();
  const selectedShapes = useValue(
    "selectedShapes",
    () => editor.getSelectedShapes(),
    [editor]
  );

  if (isFollowingPresenter) return null;

  const textShapes = selectedShapes.filter((s) => s.type === "text") as TLTextShape[];

  if (textShapes.length === 0) return null;

  const firstShape = textShapes[0];
  const currentScale = firstShape.props.scale ?? 1;
  const currentPixelSize = Math.round(currentScale * 24);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    const newScale = newSize / 24;

    editor.markHistoryStoppingPoint("change text size");
    editor.updateShapes(
      textShapes.map((s) => ({
        id: s.id,
        type: "text",
        props: { scale: newScale },
      }))
    );
  };

  return (
    <div className="absolute top-4 right-4 bg-[#202024] p-2 rounded-lg border border-[#26262B] shadow-lg flex items-center gap-2 pointer-events-auto z-[9999]">
      <span className="text-xs text-[#9A9A9F] font-medium ml-1">Font Size:</span>
      <select
        className="bg-[#161619] text-white text-xs font-medium border border-[#36363B] rounded px-2 py-1 outline-none cursor-pointer hover:bg-[#28282D] transition-colors"
        value={currentPixelSize}
        onChange={handleSizeChange}
      >
        {[12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 120].map((size) => (
          <option key={size} value={size}>
            {size}px
          </option>
        ))}
      </select>
    </div>
  );
}

function PresenterLogic({ yDoc }: { yDoc: any }) {
  const editor = useEditor();
  const { setPresenterState } = useNotesStore();
  const [presenterId, setPresenterId] = useState<string | null>(null);

  useEffect(() => {
    const yMeta = yDoc.getMap('meta');

    const handleMetaChange = () => {
      const pId = yMeta.get('presenterId') as string | undefined;
      setPresenterId(pId || null);
    };

    yMeta.observe(handleMetaChange);
    handleMetaChange();

    let unsubscribeCamera: () => void;
    if (presenterId === editor.user.getId()) {
      unsubscribeCamera = editor.store.listen(() => {
        const camera = editor.getCamera();
        const prevCam = yMeta.get('camera') as any;
        if (!prevCam || prevCam.x !== camera.x || prevCam.y !== camera.y || prevCam.z !== camera.z) {
          yMeta.set('camera', { x: camera.x, y: camera.y, z: camera.z });
        }
      }, { scope: 'session' });
    }

    return () => {
      yMeta.unobserve(handleMetaChange);
      if (unsubscribeCamera) unsubscribeCamera();
    };
  }, [editor, presenterId, yDoc]);

  useEffect(() => {
    if (presenterId && presenterId !== editor.user.getId()) {
      const yMeta = yDoc.getMap('meta');
      const handleCameraChange = () => {
        const cam = yMeta.get('camera') as any;
        if (cam) {
          editor.setCamera({ x: cam.x, y: cam.y, z: cam.z });
        }
      };
      yMeta.observe(handleCameraChange);
      handleCameraChange();
      return () => yMeta.unobserve(handleCameraChange);
    }
  }, [editor, presenterId, yDoc]);

  useEffect(() => {
    const amIPresenting = presenterId === editor.user.getId();
    const isFollowing = !!presenterId && !amIPresenting;
    setPresenterState(amIPresenting, isFollowing);

    (window as any).togglePresenter = () => {
       const yMeta = yDoc.getMap('meta');
       const currentId = yMeta.get('presenterId');
       if (currentId === editor.user.getId()) {
           yMeta.set('presenterId', null); 
       } else {
           yMeta.set('presenterId', editor.user.getId()); 
       }
    };
  }, [editor, presenterId, yDoc, setPresenterState]);

  return null;
}

import { useYjsStore } from "@/hooks/useYjsStore";
import { exportAs } from "tldraw";

import { MathShapeUtil } from "./shapes/MathShape";
import { CodeShapeUtil } from "./shapes/CodeShape";

function ExportLogic() {
  const editor = useEditor();
  
  useEffect(() => {
    (window as any).exportWhiteboard = async (format: 'png' | 'svg' = 'png') => {
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0) return alert("Nothing to export!");
      
      try {
        await exportAs(editor, shapeIds, { format });
      } catch (e) {
        console.error("Export failed", e);
        alert("Export failed. See console.");
      }
    };
    
    return () => {
      delete (window as any).exportWhiteboard;
    };
  }, [editor]);
  
  return null;
}

export default function Whiteboard() {
  const { activeNoteId, isFollowingPresenter, isReadOnly } = useNotesStore();

  const storeState = useYjsStore({
    roomId: activeNoteId || "default",
    hostUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || (typeof window !== 'undefined' ? `ws://${window.location.hostname}:1234` : "ws://localhost:1234"),
  });

  if (!activeNoteId) return null;

  if (storeState.status === "loading") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0F0F11]">
        <div className="text-[#9A9A9F] text-sm font-medium">Connecting to realtime sync server...</div>
      </div>
    );
  }

  const customShapeUtils = [MathShapeUtil, CodeShapeUtil];
  const effectivelyReadOnly = isReadOnly || isFollowingPresenter;

  return (
    <div style={{ position: "absolute", inset: 0 }} className={isFollowingPresenter ? "pointer-events-none" : ""}>
      <Tldraw 
        key={activeNoteId} 
        store={storeState.store} 
        hideUi={isFollowingPresenter} 
        {...({ isReadOnly: effectivelyReadOnly } as any)}
        shapeUtils={customShapeUtils}
      >
        <PenGoinLogic />
        <TextSizeDropdown />
        <PresenterLogic yDoc={storeState.yDoc} />
        <ExportLogic />
      </Tldraw>
    </div>
  );
}
