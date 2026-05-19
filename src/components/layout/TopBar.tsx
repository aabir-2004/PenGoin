"use client";

import { useState, useEffect, useRef } from "react";
import { useNotesStore } from "@/store/useNotesStore";

declare global {
  interface Window {
    exportWhiteboard?: (format?: "png" | "svg") => Promise<void>;
  }
}

export default function TopBar() {
  const { notes, activeNoteId, updateNote } = useNotesStore();
  const isReadOnly = useNotesStore((state) => state.isReadOnly);
  const toggleReadOnly = useNotesStore((state) => state.toggleReadOnly);
  const activeNote = notes.find((n) => n.id === activeNoteId);

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
    if (activeNoteId && editTitle.trim()) {
      updateNote(activeNoteId, { title: editTitle.trim() });
    } else if (activeNote) {
      setEditTitle(activeNote.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsEditing(false);
      if (activeNote) setEditTitle(activeNote.title);
    }
  };

  const handleExport = (format: "png" | "svg" = "png") => {
    if (window.exportWhiteboard) {
      void window.exportWhiteboard(format);
    }
  };

  return (
    <div className="h-16 border-b border-[#26262B] px-8 flex items-center justify-between bg-[#0F0F11] z-50 relative">
      {/* Breadcrumb + title */}
      <div className="flex items-center gap-2 text-xs font-medium text-[#9A9A9F]">
        <span className="cursor-pointer hover:text-white transition-colors">
          My Notes
        </span>
        <span className="text-[#5F5F64]">&gt;</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            aria-label="Note title"
            placeholder="Note title"
            className="bg-[#161619] text-white border border-[#36363B] rounded px-2 py-0.5 outline-none font-medium"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className="text-white cursor-pointer hover:underline hover:text-[#9A9A9F]"
            onClick={() => {
              setEditTitle(activeNote?.title ?? "");
              setIsEditing(true);
            }}
            title="Click to rename"
          >
            {activeNote ? activeNote.title : "No note selected"}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleExport("png")}
          className="px-4 py-2 bg-[#202024] hover:bg-[#28282D] text-xs font-medium text-white border border-[#2E2E33] rounded-lg transition-colors cursor-pointer"
        >
          Export PNG
        </button>

        <button
          type="button"
          onClick={toggleReadOnly}
          title="Toggle Read-Only Mode"
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
            isReadOnly
              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
              : "bg-[#202024] hover:bg-[#28282D] text-white border-[#2E2E33]"
          }`}
        >
          {isReadOnly ? "Read Mode: ON" : "Read Mode: OFF"}
        </button>

        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-medium text-white rounded-lg shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
        >
          Share
        </button>
      </div>
    </div>
  );
}
