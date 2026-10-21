import { Platform } from 'react-native';

/**
 * Android emulator loopback alias is 10.0.2.2.
 * Real Android device over USB debugging with `adb reverse tcp:3000 tcp:3000` is localhost:3000.
 * In production or LAN testing, change this to your machine's LAN IP (e.g. http://192.168.1.X:3000).
 */
// Read environment variables dynamically if bundled/configured via process.env
const env = (typeof process !== 'undefined' && process.env) ? process.env : {} as Record<string, string | undefined>;

export const API_CONFIG = {
  // Use 10.0.2.2 for Android emulator by default, or localhost if adb reverse / iOS
  BASE_URL: env.REACT_APP_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'),
  TIMEOUT_MS: 12000,
  /**
   * Razorpay Test Mode Key.
   * Procure from: https://dashboard.razorpay.com/#/access/api-keys
   * Loaded securely from .env or configured dynamically via setRazorpayKeyId()
   */
  RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID || '',
  /**
   * Google Cloud Translation API Key.
   * Procure from: Google Cloud Console -> APIs & Services -> Credentials
   * Loaded securely from .env or configured dynamically via setGoogleTranslateApiKey()
   */
  GOOGLE_TRANSLATE_API_KEY: env.GOOGLE_TRANSLATE_API_KEY || '',
};

export function setApiBaseUrl(url: string) {
  API_CONFIG.BASE_URL = url.replace(/\/+$/, '');
}

export function setRazorpayKeyId(key: string) {
  API_CONFIG.RAZORPAY_KEY_ID = key;
}

export function setGoogleTranslateApiKey(key: string) {
  API_CONFIG.GOOGLE_TRANSLATE_API_KEY = key;
}
