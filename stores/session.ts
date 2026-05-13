import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvJsonStorage } from '@/lib/storage';

type SessionState = {
  userId: string | null;
  setUserId: (id: string | null) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (userId) => set({ userId }),
    }),
    {
      name: 'akaito-session',
      storage: createJSONStorage(() => mmkvJsonStorage),
    },
  ),
);
