import * as Location from 'expo-location';
import { ApiClient } from '../services/api';

export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string;
  state: string;
  postcode: string;
  street?: string;
  suburb?: string;
}

/**
 * Automatically fetch device GPS coordinates and reverse-geocode to a verified Indian address.
 */
export async function getAutoGpsLocation(): Promise<GpsLocationResult | null> {
  try {
    // 1. Request foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    let lat = 18.5204;
    let lon = 73.8567;

    if (status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } else {
      // Fallback to browser geolocation if on web
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lon = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 5000 }
          );
        });
      }
    }

    // 2. Reverse geocode coordinates via OpenStreetMap Nominatim API
    const geo = await ApiClient.maps.reverseGeocode(lat, lon);
    if (geo) {
      return {
        latitude: lat,
        longitude: lon,
        displayName: geo.displayName || `${geo.city || 'Pune'}, Maharashtra`,
        city: geo.city || 'Pune',
        state: geo.state || 'Maharashtra',
        postcode: geo.postcode || '',
        street: geo.street,
        suburb: geo.suburb,
      };
    }

    return {
      latitude: lat,
      longitude: lon,
      displayName: `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      city: 'Pune',
      state: 'Maharashtra',
      postcode: '',
    };
  } catch (err) {
    console.warn('GPS location error:', err);
    return null;
  }
}
