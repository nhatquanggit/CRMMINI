import { create } from 'zustand';

const STORAGE_KEY = 'crm-mini-auth';

const readPersistedAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: null, user: null };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: parsed.user || null
    };
  } catch {
    return { token: null, user: null };
  }
};

const persistAuth = (token, user) => {
  if (!token || !user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
};

const initial = readPersistedAuth();

export const useAuthStore = create((set) => ({
  token: initial.token,
  user: initial.user,
  isAuthenticated: Boolean(initial.token),

  setAuth: ({ token, user }) => {
    persistAuth(token, user);
    set({ token, user, isAuthenticated: true });
  },

  setUser: (nextUser) =>
    set((state) => {
      const mergedUser = { ...(state.user || {}), ...(nextUser || {}) };
      persistAuth(state.token, mergedUser);
      return { user: mergedUser };
    }),

  clearAuth: () => {
    persistAuth(null, null);
    set({ token: null, user: null, isAuthenticated: false });
  }
}));
