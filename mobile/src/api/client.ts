import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

import { storage } from '@/utils/storage';

const baseURL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:8000/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
});

// The store registers this so the interceptor can sign the user out when the
// refresh token itself is rejected — the only case that should force a logout.
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: () => void): void {
  onAuthFailure = fn;
}

// Single-flight refresh: many requests can 401 at once after the access token
// expires; they all await the same refresh call instead of stampeding it.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await storage.get('refreshToken');
  if (!refresh) return null;
  try {
    // Bare axios (not apiClient) so this call never recurses through the interceptor.
    const url = `${baseURL.replace(/\/+$/, '')}/auth/refresh`;
    const { data } = await axios.post<{ access: string; refresh: string }>(url, { refresh });
    await storage.set('accessToken', data.access);
    await storage.set('refreshToken', data.refresh);
    return data.access;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = typeof original?.url === 'string' && original.url.includes('/auth/');

    // On a 401 (expired access token), refresh once and replay the request.
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshInFlight = refreshInFlight ?? refreshAccessToken();
      const newToken = await refreshInFlight;
      refreshInFlight = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      // Refresh failed → the session is truly dead. Clear storage and sign out.
      await storage.clearAll();
      onAuthFailure?.();
    }
    return Promise.reject(error);
  },
);
