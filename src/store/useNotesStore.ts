import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  addNote: (title?: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string) => void;
  isAmIPresenter: boolean;
  isFollowingPresenter: boolean;
  setPresenterState: (isAmIPresenter: boolean, isFollowingPresenter: boolean) => void;
  isReadOnly: boolean;
  toggleReadOnly: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [
        {
          id: 'default-note-1',
          title: 'Untitled Note',
          description: '',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      ],
      activeNoteId: 'default-note-1',
      isAmIPresenter: false,
      isFollowingPresenter: false,
      isReadOnly: false,
      
      setPresenterState: (isAmIPresenter, isFollowingPresenter) => 
        set({ isAmIPresenter, isFollowingPresenter }),
        
      toggleReadOnly: () => set((state) => ({ isReadOnly: !state.isReadOnly })),
      
      addNote: (title = 'Untitled Note') => set((state) => {
        const newNote: Note = {
          id: uuidv4(),
          title,
          description: '',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return {
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        };
      }),

      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
        )
      })),

      deleteNote: (id) => set((state) => {
        const newNotes = state.notes.filter(note => note.id !== id);
        return {
          notes: newNotes,
          activeNoteId: state.activeNoteId === id ? (newNotes[0]?.id || null) : state.activeNoteId
        };
      }),

      setActiveNote: (id) => set({ activeNoteId: id }),
    }),
    {
      name: 'pengoin-notes-storage',
    }
  )
);
