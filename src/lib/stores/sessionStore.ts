import { create } from "zustand";
import type { Role } from "../engine/types";

interface SessionState {
  userId: string;
  displayName: string;
  currentRole: Role | null;
  gameId: string | null;
  roomCode: string | null;

  setUserId: (id: string) => void;
  setDisplayName: (name: string) => void;
  setCurrentRole: (role: Role | null) => void;
  setGameId: (id: string | null) => void;
  setRoomCode: (code: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: "",
  displayName: "",
  currentRole: null,
  gameId: null,
  roomCode: null,

  setUserId: (id) => set({ userId: id }),
  setDisplayName: (name) => set({ displayName: name }),
  setCurrentRole: (role) => set({ currentRole: role }),
  setGameId: (id) => set({ gameId: id }),
  setRoomCode: (code) => set({ roomCode: code }),
  reset: () =>
    set({
      displayName: "",
      currentRole: null,
      gameId: null,
      roomCode: null,
    }),
}));
