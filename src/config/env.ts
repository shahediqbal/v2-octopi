export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api-v2.algologix.com.bd/api',
  mode: import.meta.env.VITE_ENV || import.meta.env.MODE,
}
