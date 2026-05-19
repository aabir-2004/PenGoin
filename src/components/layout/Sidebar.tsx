"use client";

import { Plus } from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";

export default function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNote } = useNotesStore();

  return (
    <div className="flex flex-col h-full w-[320px] md:w-[350px] shrink-0 border-r border-[#26262B] bg-[#161619] text-[#F4F4F6] z-50 relative">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">My Notes</h1>
        <button 
          onClick={() => addNote()}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#202024] hover:bg-[#28282D] text-sm text-[#F4F4F6] border border-[#2E2E33] rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add new note
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-[#26262B] flex gap-6">
        <div className="border-b-2 border-white pb-3 text-sm font-medium cursor-pointer">All Notes</div>
        <div className="pb-3 text-sm text-[#9A9A9F] hover:text-white cursor-pointer">Tags</div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {notes.map((note) => {
          const isActive = note.id === activeNoteId;
          const dateLabel = new Date(note.createdAt).toLocaleDateString();

          return (
            <div 
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors duration-200 cursor-pointer relative ${
                isActive ? 'border-[#36363B] bg-[#202024]' : 'border-[#26262B] hover:bg-[#1E1E22]'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[#5F5F64]">{dateLabel}</div>
              <div className="flex justify-between items-start">
                <h2 className="text-sm font-semibold text-[#F4F4F6] line-clamp-1">{note.title}</h2>
                {isActive && <div className="w-2 h-2 rounded-full bg-violet-500 mt-1"></div>}
              </div>
              {note.description && (
                <p className="text-xs text-[#9A9A9F] line-clamp-2 leading-relaxed">
                  {note.description}
                </p>
              )}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {note.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] font-medium text-[#9A9A9F] bg-[#1E1E22] border border-[#2E2E33] rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
