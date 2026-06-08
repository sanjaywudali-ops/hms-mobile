// ─────────────────────────────────────────────────────────────────────────────
// AXIOS INSTANCE — pre-configured HTTP client for the HMS backend.
//
// Token is read from AsyncStorage and attached to every request automatically.
// On 401, user is logged out and sent back to login.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL} from '../constants/api';

export const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT token ─────────────────────────────────────
instance.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to read auth token:', e);
    }
    return config;
  },
  error => Promise.reject(error),
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
instance.interceptors.response.use(
  response => response,
  async error => {
    if (error?.response?.status === 401) {
      // Clear session and let RootNavigator redirect to login
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
    }
    return Promise.reject(error);
  },
);