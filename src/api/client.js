import axios from 'axios';
import { API_URL, USE_MOCK } from '../config/env';
import { ENDPOINTS } from './endpoints';
import { mockAdapter } from '../mock/mockAdapter';

const TOKEN_KEY = 'ge_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage non disponibile */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage non disponibile */
    }
  },
};

/** Legge la scadenza (exp, in secondi) dal payload del JWT. */
export function tokenScaduto(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

// Callback registrata da AuthContext: logout + redirect al login
let onUnauthorized = () => {};
export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

/** Istanza Axios unica dell'applicazione. */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  // Con VITE_USE_MOCK=true le richieste non escono dal browser: le risponde il mock
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    if (tokenScaduto(token)) {
      onUnauthorized('La sessione è scaduta. Accedi di nuovo.');
      return Promise.reject(new axios.Cancel('Token scaduto'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLogin = error.config?.url === ENDPOINTS.auth.login;
    if (status === 401 && !isLogin) {
      onUnauthorized('La sessione è scaduta o non è valida. Accedi di nuovo.');
    }
    return Promise.reject(error);
  },
);

/** Traduce un errore Axios in un messaggio leggibile in italiano. */
export function messaggioErrore(error, fallback = 'Si è verificato un errore. Riprova.') {
  if (axios.isCancel(error)) return 'Richiesta annullata.';
  const status = error?.response?.status;
  const msg = error?.response?.data?.message;
  if (status === 403) return 'Azione non autorizzata.';
  if (status === 401) return msg || 'Credenziali errate o sessione scaduta.';
  if (msg) return msg;
  if (status === 404) return 'Risorsa non trovata.';
  if (status >= 500) return 'Il server non risponde correttamente. Riprova più tardi.';
  if (!error?.response) return 'Impossibile contattare il server. Controlla la connessione.';
  return fallback;
}

export function codiceErrore(error) {
  return error?.response?.data?.codice;
}
