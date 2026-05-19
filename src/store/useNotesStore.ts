import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Simplified store — one document per user, pages managed inside tldraw.
 * The "notebook title" is just a display name for the single workspace.
 */
interface WorkspaceState {
  workspaceTitle: string;
  setWorkspaceTitle: (title: string) => void;
  isReadOnly: boolean;
  toggleReadOnly: () => void;
}

export const useNotesStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaceTitle: 'My Notes',
      setWorkspaceTitle: (title) => set({ workspaceTitle: title }),
      isReadOnly: false,
      toggleReadOnly: () => set((state) => ({ isReadOnly: !state.isReadOnly })),
    }),
    { name: 'pengoin-workspace-storage' }
  )
);

// Single fixed room ID — one document for the whole app
export const ROOM_ID = 'pengoin-main';
