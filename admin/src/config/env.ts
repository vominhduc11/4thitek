/**
 * Environment configuration
 * All environment variables should be accessed through this file
 */

export const env = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8080'),
  mediaUploadUrl: import.meta.env.VITE_MEDIA_UPLOAD_URL || `${import.meta.env.VITE_API_URL || ''}/api/media`,
  wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:8087',

  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'DistributeX Admin',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',

  // Derived values
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

// Type-safe environment variable access
export type Env = typeof env;
