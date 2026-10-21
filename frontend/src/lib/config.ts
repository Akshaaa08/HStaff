import { Platform } from 'react-native';

/**
 * Android emulator loopback alias is 10.0.2.2.
 * Real Android device over USB debugging with `adb reverse tcp:3000 tcp:3000` is localhost:3000.
 * In production or LAN testing, change this to your machine's LAN IP (e.g. http://192.168.1.X:3000).
 */
export const API_CONFIG = {
  // Use 10.0.2.2 for Android emulator by default, or localhost if adb reverse / iOS
  BASE_URL: Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
  TIMEOUT_MS: 12000,
};

export function setApiBaseUrl(url: string) {
  API_CONFIG.BASE_URL = url.replace(/\/+$/, '');
}
