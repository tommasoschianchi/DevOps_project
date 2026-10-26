import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventiService } from '../services';
import { useApi } from '../hooks/useApi';
import StatoAsync from '../components/StatoAsync';
import EventCard from '../components/eventi/EventCard';
import FiltriEventi, { FILTRI_VUOTI } from '../components/eventi/FiltriEventi';

/** US-07: catalogo pubblico con filtri e ricerca (i filtri restano nell'URL, condivisibili). */
export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const chiave = JSON.stringify(Object.fromEntries(Object.keys(FILTRI_VUOTI).map((k) => [k, searchParams.get(k) || ''])));
  const filtri = useMemo(() => JSON.parse(chiave), [chiave]);

  const { dati, caricamento, errore, ricarica } = useApi(() => eventiService.lista(filtri), [filtri]);

  const onCambia = useCallback(
    (nuovi) => setSearchParams(Object.fromEntries(Object.entries(nuovi).filter(([, v]) => v)), { replace: true }),
    [setSearchParams],
  );

  // [PROPOSTA] il catalogo pubblico mostra solo gli eventi attivi e futuri
  const eventi = (dati || []).filter((e) => e.stato === 'attivo' && new Date(e.dataOra) >= new Date());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Catalogo eventi</h1>
      <FiltriEventi valori={filtri} onCambia={onCambia} />
      <StatoAsync
        caricamento={caricamento}
        errore={errore}
        onRiprova={ricarica}
        vuoto={eventi.length === 0}
        messaggioVuoto="Nessun evento corrisponde ai filtri selezionati."
      >
        <p className="text-sm text-slate-700" aria-live="polite">{eventi.length} eventi trovati</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventi.map((e) => (
            <li key={e.id}>
              <EventCard evento={e} />
            </li>
          ))}
        </ul>
      </StatoAsync>
    </div>
  );
}
