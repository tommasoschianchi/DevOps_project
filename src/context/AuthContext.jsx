import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { setOnUnauthorized, tokenStore, tokenScaduto } from '../api/client';
import { can as canRuolo, RUOLI } from '../config/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [utente, setUtente] = useState(null);
  const [inizializzato, setInizializzato] = useState(false);

  const logout = useCallback(
    (messaggio) => {
      tokenStore.clear();
      setUtente(null);
      navigate('/login', { replace: true, state: messaggio ? { messaggio } : undefined });
    },
    [navigate],
  );

  // Flusso del documento: token scaduto o 401 → logout e redirect al login
  useEffect(() => {
    setOnUnauthorized((messaggio) => {
      if (tokenStore.get()) logout(messaggio);
    });
  }, [logout]);

  // Ripristino della sessione al caricamento: GET /api/auth/me
  useEffect(() => {
    const token = tokenStore.get();
    if (!token || tokenScaduto(token)) {
      tokenStore.clear();
      setInizializzato(true);
      return;
    }
    authService
      .me()
      .then(setUtente)
      .catch(() => tokenStore.clear())
      .finally(() => setInizializzato(true));
  }, []);

  // Flusso del documento: POST /api/auth/login → { token, ruolo } → salva il JWT
  const login = useCallback(async (email, password) => {
    const { token } = await authService.login(email, password);
    tokenStore.set(token);
    const me = await authService.me();
    setUtente(me);
    return me;
  }, []);

  const valore = useMemo(
    () => ({
      utente,
      ruolo: utente?.ruolo || RUOLI.OSPITE,
      inizializzato,
      login,
      logout,
      can: (azione) => canRuolo(utente?.ruolo, azione),
    }),
    [utente, inizializzato, login, logout],
  );

  return <AuthContext.Provider value={valore}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
