import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { notificheService } from '../services';
import { useAuth } from './AuthContext';
import { AZIONI } from '../config/permissions';
import { POLLING_NOTIFICHE_MS } from '../config/regole';

const NotificheContext = createContext({ nonLette: 0, aggiorna: () => {} });

/** Contatore notifiche non lette, aggiornato dopo ogni azione e periodicamente. */
export function NotificheProvider({ children }) {
  const { utente, can } = useAuth();
  const abilitato = !!utente && can(AZIONI.NOTIFICHE_VEDI);
  const [nonLette, setNonLette] = useState(0);

  const aggiorna = useCallback(async () => {
    if (!abilitato) return setNonLette(0);
    try {
      const lista = await notificheService.lista();
      setNonLette(lista.filter((n) => !n.letta).length);
    } catch {
      /* il contatore non è critico: si riprova al prossimo giro */
    }
  }, [abilitato]);

  useEffect(() => {
    aggiorna();
    if (!abilitato) return undefined;
    const t = setInterval(aggiorna, POLLING_NOTIFICHE_MS);
    return () => clearInterval(t);
  }, [aggiorna, abilitato]);

  return <NotificheContext.Provider value={{ nonLette, aggiorna }}>{children}</NotificheContext.Provider>;
}

export const useNotifiche = () => useContext(NotificheContext);
