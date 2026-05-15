import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
