/** Base URL of the .NET API. Override with EXPO_PUBLIC_API_URL. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:5080';
