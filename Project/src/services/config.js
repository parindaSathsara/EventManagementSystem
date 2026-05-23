/**
 * Runtime configuration. Single import surface for keys + API endpoints.
 * For production, move keys into Expo extra config / env vars and restrict
 * the Google key to your app bundle ID + app store package name in
 * Google Cloud Console.
 */

export const GOOGLE_PLACES_API_KEY = 'AIzaSyA0Z8_GzoG68yaI8pAEkA_03Ig1N-6qki8';

// Default search center if the user hasn't picked anything yet.
export const DEFAULT_LOCATION = {
  name: 'Colombo, Sri Lanka',
  shortName: 'Colombo',
  lat: 6.9271,
  lng: 79.8612,
};
