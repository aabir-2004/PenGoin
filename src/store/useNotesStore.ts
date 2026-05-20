import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PresentationState {
  active: boolean;
  currentPageId: string | null;
  isScreenLocked: boolean;
  presenterId: string | null;
}

export const DEFAULT_PRESENTATION_STATE: PresentationState = {
  active: false,
  currentPageId: null,
  isScreenLocked: true,
  presenterId: null,
};

/**
 * Simplified store — one document per user, pages managed inside tldraw.
 * The "notebook title" is just a display name for the single workspace.
 */
interface WorkspaceState {
  deviceId: string;
  workspaceTitle: string;
  setWorkspaceTitle: (title: string) => void;
  isReadOnly: boolean;
  toggleReadOnly: () => void;
  preferredTextSize: number;
  setPreferredTextSize: (size: number) => void;
  isPresentationView: boolean;
  setPresentationView: (value: boolean) => void;
  togglePresentationView: () => void;
  presentationState: PresentationState;
  setPresentationState: (state: PresentationState) => void;
}

export const useNotesStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      deviceId: crypto.randomUUID(),
      workspaceTitle: 'My Notes',
      setWorkspaceTitle: (title) => set({ workspaceTitle: title }),
      isReadOnly: false,
      toggleReadOnly: () => set((state) => ({ isReadOnly: !state.isReadOnly })),
      preferredTextSize: 24,
      setPreferredTextSize: (size) => set({ preferredTextSize: size }),
      isPresentationView: false,
      setPresentationView: (value) => set({ isPresentationView: value }),
      togglePresentationView: () =>
        set((state) => ({ isPresentationView: !state.isPresentationView })),
      presentationState: DEFAULT_PRESENTATION_STATE,
      setPresentationState: (presentationState) => set({ presentationState }),
    }),
    { name: 'pengoin-workspace-storage' }
  )
);

// Single fixed room ID — one document for the whole app
export const ROOM_ID = 'pengoin-main';
