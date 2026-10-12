export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api-v2.algologix.com.bd/api',
    aiApiBaseUrl:
    import.meta.env.VITE_AI_API_BASE_URL ||
    'https://localhost:7188/api',
    
  mode: import.meta.env.VITE_ENV || import.meta.env.MODE,
}
