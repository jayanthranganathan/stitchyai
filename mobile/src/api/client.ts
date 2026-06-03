import axios, { type AxiosInstance } from 'axios';
import Constants from 'expo-constants';

import { storage } from '@/utils/storage';

const baseURL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:8000/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
});

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
    // TODO: refresh-token rotation on 401 with retry
    return Promise.reject(error);
  },
);
