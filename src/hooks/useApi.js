import { useCallback, useEffect, useRef, useState } from 'react';
import { messaggioErrore } from '../api/client';

/**
 * Esegue una chiamata API e ne espone gli stati: dati, caricamento, errore.
 * `ricarica()` rilancia la chiamata (usato dopo ogni azione per avere dati aggiornati).
 */
export function useApi(funzione, dipendenze = []) {
  const [dati, setDati] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const ultimaRichiesta = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const esegui = useCallback(funzione, dipendenze);

  const ricarica = useCallback(
    async ({ silenzioso = false } = {}) => {
      const id = ++ultimaRichiesta.current;
      if (!silenzioso) setCaricamento(true);
      setErrore(null);
      try {
        const risultato = await esegui();
        if (id === ultimaRichiesta.current) setDati(risultato);
      } catch (e) {
        if (id === ultimaRichiesta.current) setErrore(messaggioErrore(e));
      } finally {
        if (id === ultimaRichiesta.current) setCaricamento(false);
      }
    },
    [esegui],
  );

  useEffect(() => {
    ricarica();
  }, [ricarica]);

  return { dati, caricamento, errore, ricarica, setDati };
}
