import { create } from 'zustand';

import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { ProfileUpdate, Role, TokenPair, User } from '@/types';
import { storage } from '@/utils/storage';

type AuthState = {
  user: User | null;
  activeRole: Role | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'guest';
  hydrate: () => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  firebaseLogin: (idToken: string) => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<void>;
  setActiveRole: (role: Role) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  activeRole: null,
  status: 'idle',

  async hydrate() {
    const access = await storage.get('accessToken');
    if (!access) {
      set({ status: 'unauthenticated' });
      return;
    }
    try {
      const { data } = await apiClient.get<User>(endpoints.users.me);
      const role = ((await storage.get('activeRole')) as Role | null) ?? data.roles[0] ?? null;
      set({ user: data, activeRole: role, status: 'authenticated' });
    } catch {
      await storage.clearAll();
      set({ status: 'unauthenticated' });
    }
  },

  async requestOtp(phone) {
    // Do NOT touch status here — changing it causes RootNavigator to remount
    // AuthNavigator and reset the navigation stack back to Landing.
    await apiClient.post(endpoints.auth.requestOtp, { phone });
  },

  async verifyOtp(phone, code) {
    set({ status: 'loading' });
    const { data } = await apiClient.post<{ user: User; tokens: TokenPair }>(
      endpoints.auth.verifyOtp,
      { phone, code },
    );
    await storage.set('accessToken', data.tokens.access);
    await storage.set('refreshToken', data.tokens.refresh);
    const role = data.user.roles[0] ?? null;
    if (role) await storage.set('activeRole', role);
    set({ user: data.user, activeRole: role, status: 'authenticated' });
  },

  async firebaseLogin(idToken) {
    // Exchange a verified Firebase ID token for our own JWT pair.
    set({ status: 'loading' });
    const { data } = await apiClient.post<{ user: User; tokens: TokenPair }>(
      endpoints.auth.firebase,
      { id_token: idToken },
    );
    await storage.set('accessToken', data.tokens.access);
    await storage.set('refreshToken', data.tokens.refresh);
    const role = data.user.roles[0] ?? null;
    if (role) await storage.set('activeRole', role);
    set({ user: data.user, activeRole: role, status: 'authenticated' });
  },

  async updateProfile(patch) {
    const { data } = await apiClient.patch<User>(endpoints.users.me, patch);
    set({ user: data });
  },

  async setActiveRole(role) {
    await storage.set('activeRole', role);
    set({ activeRole: role });
  },

  continueAsGuest() {
    set({ user: null, activeRole: 'customer', status: 'guest' });
  },

  async logout() {
    await storage.clearAll();
    set({ user: null, activeRole: null, status: 'unauthenticated' });
  },
}));
