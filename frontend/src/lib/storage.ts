import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same storage key + shape the web prototype used for localStorage, so session recovery behaves identically. */
const KEY = 'hstaff-session-v1';

export async function loadSession<T>(): Promise<Partial<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}
export async function saveSession(value: unknown) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage is best-effort */
  }
}
