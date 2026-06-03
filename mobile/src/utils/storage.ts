import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'thugil.access',
  refreshToken: 'thugil.refresh',
  activeRole: 'thugil.role',
} as const;

export type StorageKey = keyof typeof KEYS;

export const storage = {
  async get(key: StorageKey): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS[key]);
  },
  async set(key: StorageKey, value: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS[key], value);
  },
  async remove(key: StorageKey): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS[key]);
  },
  async clearAll(): Promise<void> {
    await Promise.all(Object.keys(KEYS).map((k) => SecureStore.deleteItemAsync(KEYS[k as StorageKey])));
  },
};
