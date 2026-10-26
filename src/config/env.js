// Configurazione da variabili d'ambiente (lette al momento della build da Vite)
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
