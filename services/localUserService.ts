import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  DISPLAY_NAME: '@sarina:display_name',
  NAV_HISTORY: '@sarina:nav_history',
};

export type HistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  timestamp: number;
};

// ─── Display Name ────────────────────────────────────────────────────────────

export const getDisplayName = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.DISPLAY_NAME);
  } catch {
    return null;
  }
};

export const setDisplayName = async (name: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.DISPLAY_NAME, name.trim());
};

export const hasOnboarded = async (): Promise<boolean> => {
  try {
    const name = await AsyncStorage.getItem(KEYS.DISPLAY_NAME);
    return name !== null && name.trim().length > 0;
  } catch {
    return false;
  }
};

// ─── Navigation History ───────────────────────────────────────────────────────

export const getNavigationHistory = async (): Promise<HistoryItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.NAV_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
};

export const addNavigationHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const history = await getNavigationHistory();
    // remove duplicate by title, keep most recent
    const filtered = history.filter(h => h.title !== item.title);
    const newItem: HistoryItem = {
      ...item,
      id: `${Date.now()}`,
      timestamp: Date.now(),
    };
    // prepend and keep max 5 entries
    const updated = [newItem, ...filtered].slice(0, 5);
    await AsyncStorage.setItem(KEYS.NAV_HISTORY, JSON.stringify(updated));
  } catch {}
};

// ─── Reset ───────────────────────────────────────────────────────────────────

export const resetAppData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([KEYS.DISPLAY_NAME, KEYS.NAV_HISTORY]);
  } catch {}
};
