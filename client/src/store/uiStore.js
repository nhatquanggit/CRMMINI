import { create } from 'zustand';

const STORAGE_KEY = 'crm-mini-ui';

const readUiPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { language: 'vi', darkMode: localStorage.getItem('crm-theme') === 'dark' };
    }

    const parsed = JSON.parse(raw);
    return {
      language: parsed.language === 'en' ? 'en' : 'vi',
      darkMode: Boolean(parsed.darkMode)
    };
  } catch {
    return { language: 'vi', darkMode: localStorage.getItem('crm-theme') === 'dark' };
  }
};

const persistUiPrefs = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem('crm-language', state.language);
  localStorage.setItem('crm-theme', state.darkMode ? 'dark' : 'light');
};

const applyThemeClass = (darkMode) => {
  if (typeof document === 'undefined') {
    return;
  }

  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const initial = readUiPrefs();
applyThemeClass(initial.darkMode);

export const useUiStore = create((set) => ({
  language: initial.language,
  darkMode: initial.darkMode,

  setLanguage: (language) =>
    set((state) => {
      const next = { ...state, language: language === 'en' ? 'en' : 'vi' };
      persistUiPrefs({ language: next.language, darkMode: next.darkMode });
      return { language: next.language };
    }),

  setDarkMode: (darkMode) =>
    set((state) => {
      const next = { ...state, darkMode: Boolean(darkMode) };
      persistUiPrefs({ language: next.language, darkMode: next.darkMode });
      applyThemeClass(next.darkMode);
      return { darkMode: next.darkMode };
    })
}));
