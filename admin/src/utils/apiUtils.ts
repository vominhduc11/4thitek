/**
 * Advanced API Utilities
 * Queue-based token refresh, retry logic, timeout handling
 */

import { logger } from './logger';
import { ROUTES } from '../config/routes';

// Token refresh queue management (inspired by Dealer portal)
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

export const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

export const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

export const setRefreshingState = (state: boolean) => {
  isRefreshing = state;
};

export const getRefreshingState = () => isRefreshing;

/**
 * Redirect to login page
 */
export const redirectToLogin = () => {
  localStorage.removeItem('distributex_auth');
  window.location.href = ROUTES.LOGIN;
};

/**
 * Get auth token from localStorage
 */
export const getAuthTokenFromStorage = (): string | null => {
  const auth = localStorage.getItem('distributex_auth');
  if (auth) {
    try {
      const authData = JSON.parse(auth);
      return authData.token || null;
    } catch (error) {
      logger.error('Failed to parse auth data', error);
      localStorage.removeItem('distributex_auth');
    }
  }
  return null;
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Add 60 second buffer to refresh before actual expiry
    return (payload.exp * 1000 - 60000) < Date.now();
  } catch {
    return true;
  }
};

/**
 * Check if we need to refresh token before making request
 */
export const shouldRefreshToken = (): boolean => {
  const token = getAuthTokenFromStorage();
  if (!token) return false;
  return isTokenExpired(token);
};
