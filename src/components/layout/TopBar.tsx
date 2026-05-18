"use client";

import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Play, Square, Eye } from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";

export default function TopBar() {
  const { notes, activeNoteId, updateNote, isAmIPresenter, isFollowingPresenter } = useNotesStore();
  const activeNote = notes.find(n => n.id === activeNoteId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
    }
  }, [activeNote]);

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

  const handleTogglePresent = () => {
    if ((window as any).togglePresenter) {
      (window as any).togglePresenter();
    }
  };

  return (
    <div className="h-16 border-b border-[#26262B] px-8 flex items-center justify-between bg-[#0F0F11] z-50 relative">
      <div className="flex items-center gap-2 text-xs font-medium text-[#9A9A9F]">
        <span className="cursor-pointer hover:text-white transition-colors">My Notes</span>
        <span className="text-[#5F5F64]">&gt;</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="bg-[#161619] text-white border border-[#36363B] rounded px-2 py-0.5 outline-none font-medium"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span 
            className="text-white cursor-pointer hover:underline hover:text-[#9A9A9F]"
            onClick={() => setIsEditing(true)}
            title="Click to rename"
          >
            {activeNote ? activeNote.title : 'No note selected'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isFollowingPresenter && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-full border border-indigo-500/20">
            <Eye size={14} />
            Viewing Presenter Screen
          </div>
        )}
        
        {!isFollowingPresenter && (
          <button 
            onClick={handleTogglePresent}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              isAmIPresenter 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
            }`}
          >
            {isAmIPresenter ? <Square size={14} /> : <Play size={14} />}
            {isAmIPresenter ? 'Stop Presenting' : 'Start Presenting'}
          </button>
        )}

        <button 
          onClick={() => {
             if ((window as any).exportWhiteboard) (window as any).exportWhiteboard('png');
          }}
          className="px-4 py-2 bg-[#202024] hover:bg-[#28282D] text-xs font-medium text-white border border-[#2E2E33] rounded-lg transition-colors cursor-pointer"
        >
          Export PNG
        </button>
        
        <button 
          onClick={useNotesStore.getState().toggleReadOnly}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
            useNotesStore((state) => state.isReadOnly)
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              : 'bg-[#202024] hover:bg-[#28282D] text-white border-[#2E2E33]'
          }`}
          title="Toggle Read-Only Mode"
        >
          {useNotesStore((state) => state.isReadOnly) ? 'Read Mode: ON' : 'Read Mode: OFF'}
        </button>
        
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-medium text-white rounded-lg shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer">
          Share
        </button>
      </div>
    </div>
  );
}

