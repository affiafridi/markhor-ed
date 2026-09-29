import { create } from "zustand";

/**
 * Interface chrome state. Kept separate from the experience store so that
 * opening a menu never invalidates anything subscribed to the 3D scene.
 */
export interface UIState {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isMenuOpen: false,
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
}));
