// Central API configuration.
//
// For release builds, set EXPO_PUBLIC_API_URL to the deployed backend URL, e.g.:
//   npx expo start / eas build  with  EXPO_PUBLIC_API_URL=https://task-buddy-api.onrender.com
// If it is unset (local development), fall back to the local dev server.

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

export const API_BASE = `${API_URL}/api`; // REST endpoints
export const WS_URL = API_URL.startsWith('https')
  ? `wss://${API_URL.slice('https://'.length)}/ws/chat`
  : `${API_URL.replace(/^http/, 'ws')}/ws/chat`; // WebSocket chat + calls
