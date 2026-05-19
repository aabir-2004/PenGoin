"use client";

import { useState, useEffect, useRef } from "react";
import { useNotesStore } from "@/store/useNotesStore";

declare global {
  interface Window {
    exportWhiteboard?: (format?: "png" | "svg" | "pdf") => Promise<void>;
  }
}

export default function TopBar() {
  const { workspaceTitle, setWorkspaceTitle } = useNotesStore();
  const isReadOnly = useNotesStore((s) => s.isReadOnly);
  const toggleReadOnly = useNotesStore((s) => s.toggleReadOnly);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editTitle.trim()) setWorkspaceTitle(editTitle.trim());
    else setEditTitle(workspaceTitle);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(workspaceTitle);
    }
  };

  return (
    <div className="h-14 border-b border-[#26262B] px-6 flex items-center justify-between bg-[#0F0F11] z-50 relative shrink-0">
      {/* Title */}
      <div className="flex items-center gap-2 text-xs font-medium text-[#9A9A9F]">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            aria-label="Workspace title"
            placeholder="Workspace title"
            className="bg-[#161619] text-white border border-[#36363B] rounded px-2 py-0.5 outline-none font-semibold text-sm"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className="text-white font-semibold text-sm cursor-pointer hover:text-[#9A9A9F] transition-colors"
            onClick={() => {
              setEditTitle(workspaceTitle);
              setIsEditing(true);
            }}
            title="Click to rename"
          >
            {workspaceTitle}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.exportWhiteboard?.("png")}
          className="px-3 py-1.5 bg-[#202024] hover:bg-[#28282D] text-xs font-medium text-white border border-[#2E2E33] rounded-lg transition-colors"
        >
          Export PNG
        </button>

        <button
          type="button"
          onClick={() => window.exportWhiteboard?.("pdf")}
          className="px-3 py-1.5 bg-[#202024] hover:bg-[#28282D] text-xs font-medium text-white border border-[#2E2E33] rounded-lg transition-colors"
        >
          Export PDF
        </button>

        <button
          type="button"
          onClick={toggleReadOnly}
          title="Toggle Read-Only Mode"
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            isReadOnly
              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
              : "bg-[#202024] hover:bg-[#28282D] text-white border-[#2E2E33]"
          }`}
        >
          {isReadOnly ? "Read Only" : "Editing"}
        </button>

        <button
          type="button"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition-colors"
        >
          Share
        </button>
      </div>
    </div>
  );
}
