/**
 * User Location Service
 * Retrieves the device's current GPS position via the browser Geolocation API.
 * Handles all permission/timeout/unavailable error cases gracefully.
 */

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Resolves with the user's current coordinates or rejects with a human-readable error.
 */
export function getUserLocation(): Promise<UserCoordinates> {
  return new Promise<UserCoordinates>((resolve, reject) => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser.';
      console.error('[Location] Failed to retrieve location:', msg);
      reject(new Error(msg));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('[Location] User coordinates:', latitude, longitude);
        resolve({ latitude, longitude });
      },
      (err: GeolocationPositionError) => {
        const messages: Record<number, string> = {
          1: 'Location access was denied. Please allow location access in your browser settings.',
          2: 'Your position could not be determined.',
          3: 'Location request timed out. Please try again.',
        };
        const msg = messages[err.code] ?? `Geolocation error (code ${err.code}).`;
        console.error('[Location] Failed to retrieve location:', msg);
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 120_000, // Use a cached position up to 2 minutes old
      },
    );
  });
}
