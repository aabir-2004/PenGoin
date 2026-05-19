"use client";

import { Plus, Trash2 } from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";
import { useState } from "react";

export default function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNote, deleteNote } = useNotesStore();
  const [activeTab, setActiveTab] = useState<'all' | 'tags'>('all');

  return (
    <div className="relative z-50 flex h-full w-[370px] shrink-0 flex-col border-r border-white/8 bg-[linear-gradient(180deg,_rgba(18,18,20,0.94)_0%,_rgba(13,13,15,0.98)_100%)] text-[#F4F4F6]">
      {/* Header */}
      <div className="flex flex-col gap-6 px-7 pb-5 pt-9">
        <h1 className="text-[32px] font-medium tracking-[-0.03em] text-white">My Notes</h1>
        <button 
          onClick={() => addNote()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-white/6 bg-[linear-gradient(180deg,_rgba(42,42,45,0.82)_0%,_rgba(28,28,31,0.88)_100%)] px-5 py-4 text-left text-[14px] font-medium text-[#E4E4E8] transition-all duration-200 hover:border-white/12 hover:bg-[linear-gradient(180deg,_rgba(49,49,53,0.88)_0%,_rgba(33,33,37,0.94)_100%)]"
        >
          <Plus size={18} strokeWidth={2.2} />
          Add new note
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-7 border-b border-white/8 px-7">
        <button 
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer pb-3 text-[15px] font-medium transition-colors ${
            activeTab === 'all' 
              ? 'border-b-2 border-white text-white' 
              : 'text-[#7A7A80] hover:text-white'
          }`}
        >
          All Notes
        </button>
        <button 
          onClick={() => setActiveTab('tags')}
          className={`cursor-pointer pb-3 text-[15px] font-medium transition-colors ${
            activeTab === 'tags' 
              ? 'border-b-2 border-white text-white' 
              : 'text-[#7A7A80] hover:text-white'
          }`}
        >
          Tags
        </button>
      </div>

      {/* Notes List */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
        {notes.map((note) => {
          const isActive = note.id === activeNoteId;
          const date = new Date(note.createdAt);
          const dateLabel = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' }).toUpperCase()}`;

          // Assign consistent color for active dot based on index
          const dotColors = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'];
          const noteIndex = notes.indexOf(note);
          const dotColor = dotColors[noteIndex % dotColors.length];

          return (
            <div 
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              className={`group relative flex cursor-pointer flex-col gap-2 rounded-[22px] border p-5 transition-all duration-200 ${
                isActive 
                  ? 'border-white/10 bg-[linear-gradient(180deg,_rgba(42,42,45,0.86)_0%,_rgba(29,29,32,0.92)_100%)] shadow-[0_18px_45px_rgba(0,0,0,0.22)]' 
                  : 'border-transparent bg-transparent hover:border-white/6 hover:bg-white/[0.03]'
              }`}
            >
              {/* Date & dot */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#73737A]">
                  {dateLabel}
                </span>
                {isActive && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                )}
              </div>

              {/* Title */}
              <h2 className="line-clamp-1 text-[17px] font-medium leading-tight text-[#F4F4F6]">
                {note.title}
              </h2>

              {/* Description */}
              {note.description && (
                <p className="line-clamp-2 text-[13px] leading-7 text-[#9E9EA4]">
                  {note.description}
                </p>
              )}

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {note.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="rounded-lg border border-white/6 bg-white/6 px-3 py-1 text-[11px] font-medium text-[#C3C3C9]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Delete button (on hover, only for non-active) */}
              {notes.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="absolute right-4 top-4 p-1 text-[#67676D] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-red-400"
                  title="Delete note"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
