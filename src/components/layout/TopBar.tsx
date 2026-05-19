"use client";

import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Play, Square, Eye } from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";

declare global {
  interface Window {
    togglePresenter?: () => void;
    exportWhiteboard?: (format?: "png" | "svg") => Promise<void>;
  }
}

export default function TopBar() {
  const { notes, activeNoteId, updateNote, isAmIPresenter, isFollowingPresenter } = useNotesStore();
  const isReadOnly = useNotesStore((state) => state.isReadOnly);
  const toggleReadOnly = useNotesStore((state) => state.toggleReadOnly);
  const activeNote = notes.find(n => n.id === activeNoteId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastSaved = activeNote
    ? new Date(activeNote.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleTogglePresent = () => {
    if (window.togglePresenter) {
      window.togglePresenter();
    }
  };

  const handleExport = (format: 'png' | 'svg' = 'png') => {
    if (window.exportWhiteboard) {
      void window.exportWhiteboard(format);
    }
    setShowMenu(false);
  };

  return (
    <div className="relative z-50 flex h-[88px] items-center justify-between px-8 text-white">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3 text-sm font-medium text-[#A4A4AC]">
        <span className="cursor-pointer transition-colors hover:text-white">My Notes</span>
        <span className="text-[#4A4A4F]">›</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white outline-none"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span 
            className="cursor-pointer text-[15px] text-white transition-colors hover:text-[#D8D8DE]"
            onClick={() => {
              setEditTitle(activeNote?.title ?? "");
              setIsEditing(true);
            }}
            title="Click to rename"
          >
            {activeNote ? activeNote.title : 'No note selected'}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {isFollowingPresenter && (
          <div className="flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-300">
            <Eye size={12} />
            Viewing Presenter
          </div>
        )}
        
        {!isFollowingPresenter && (
          <button 
            onClick={handleTogglePresent}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-medium transition-all duration-200 ${
              isAmIPresenter 
                ? 'border-red-400/15 bg-red-500/10 text-red-300 hover:bg-red-500/20' 
                : 'border-emerald-400/15 bg-emerald-500/8 text-emerald-300 hover:bg-emerald-500/15'
            }`}
          >
            {isAmIPresenter ? <Square size={11} /> : <Play size={11} />}
            {isAmIPresenter ? 'Stop' : 'Present'}
          </button>
        )}

        {/* Read-only toggle */}
        <button 
          onClick={toggleReadOnly}
          className={`cursor-pointer rounded-xl border px-3.5 py-2 text-[11px] font-medium transition-all duration-200 ${
            isReadOnly
              ? 'border-amber-400/15 bg-amber-500/10 text-amber-300'
              : 'border-transparent bg-transparent text-[#7E7E84] hover:bg-white/5 hover:text-white'
          }`}
          title="Toggle Read-Only Mode"
        >
          {isReadOnly ? 'Read Only' : 'Edit'}
        </button>

        {/* Saved timestamp */}
        {lastSaved && (
          <span className="hidden rounded-xl border border-white/8 bg-white/4 px-3.5 py-2 text-[12px] font-medium text-[#C2C2C8] md:block">
            Saved {lastSaved}
          </span>
        )}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="cursor-pointer rounded-xl p-2.5 text-[#8B8B90] transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-[100] mt-3 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#171719] shadow-2xl shadow-black/40">
              <button 
                onClick={() => handleExport('png')}
                className="w-full px-4 py-2.5 text-left text-xs text-[#D0D0D5] transition-colors hover:bg-white/5"
              >
                Export as PNG
              </button>
              <button 
                onClick={() => handleExport('svg')}
                className="w-full px-4 py-2.5 text-left text-xs text-[#D0D0D5] transition-colors hover:bg-white/5"
              >
                Export as SVG
              </button>
              <div className="border-t border-white/8" />
              <button 
                onClick={() => { navigator.clipboard.writeText(window.location.href); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-xs text-[#D0D0D5] transition-colors hover:bg-white/5"
              >
                Copy Share Link
              </button>
            </div>
          )}
        </div>
        
        <button className="cursor-pointer rounded-xl bg-[#7A5AF8] px-5 py-2.5 text-[12px] font-semibold text-white shadow-[0_12px_30px_rgba(122,90,248,0.35)] transition-all duration-200 hover:bg-[#8B6BFF] active:bg-[#6D50E7]">
          Share
        </button>
      </div>
    </div>
  );
}
