// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api'  // Android emulator
  : 'https://your-production-api.com/api';

export const WEBSOCKET_URL = __DEV__
  ? 'http://10.0.2.2:3000'
  : 'https://your-production-api.com';

// App Configuration
export const APP_NAME = 'Restaurant Hiring';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'user',
  OFFLINE_DATA: 'offlineData',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  APPLICATION_UPDATE: 'APPLICATION_UPDATE',
  JOB_MATCH: 'JOB_MATCH',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  SHIFT_REMINDER: 'SHIFT_REMINDER',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
};

// Offline Sync
export const OFFLINE_SYNC = {
  SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
};

// Chat Configuration
export const CHAT_CONFIG = {
  MESSAGE_PAGE_SIZE: 50,
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_TIMEOUT_MS: 3000,
  FILE_UPLOAD_TIMEOUT_MS: 30000,
};

// Location Services
export const LOCATION_CONFIG = {
  ACCURACY: 'high' as const,
  TIMEOUT: 15000,
  MAXIMUM_AGE: 10000,
  DISTANCE_FILTER: 10, // meters
};

// Push Notifications
export const PUSH_NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'restaurant_hiring_channel',
  CHANNEL_NAME: 'Restaurant Hiring Notifications',
  SOUND_NAME: 'default',
  VIBRATION_PATTERN: [0, 250, 250, 250],
};

// Analytics
export const ANALYTICS_CONFIG = {
  TRACKING_ENABLED: !__DEV__,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_UPLOAD_ERROR: 'File upload failed. Please try again.',
  LOCATION_ERROR: 'Unable to get your location. Please enable location services.',
  CAMERA_ERROR: 'Unable to access camera. Please check permissions.',
};