import { Link, useParams } from 'react-router-dom';
import { eventiService } from '../services';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { AZIONI } from '../config/permissions';
import StatoAsync from '../components/StatoAsync';
import { BadgeEventoAnnullato, BadgeTipo } from '../components/Badge';
import PannelloPrenotazione from '../components/prenotazione/PannelloPrenotazione';
import { formatData, formatPrezzo } from '../utils/format';

/** US-07: pagina di dettaglio con pulsante di prenotazione (login richiesto per prenotare). */
export default function DettaglioEvento() {
  const { id } = useParams();
  const { can } = useAuth();
  const { dati: evento, caricamento, errore, ricarica } = useApi(() => eventiService.dettaglio(id), [id]);

  return (
    <div>
      <Link to="/eventi" className="link text-sm">← Torna al catalogo</Link>
      <div className="mt-4">
        <StatoAsync caricamento={caricamento && !evento} errore={errore} onRiprova={ricarica}>
          {evento && (
            <div className="grid gap-6 lg:grid-cols-5">
              <article className="card lg:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeTipo tipo={evento.tipo} />
                  <span className="text-sm text-slate-600">{evento.categoria}</span>
                  {evento.stato === 'annullato' && <BadgeEventoAnnullato />}
                </div>
                <h1 className="mt-3 text-2xl font-bold">{evento.titolo}</h1>
                <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                  <dt className="font-semibold">Quando</dt>
                  <dd>{formatData(evento.dataOra)}</dd>
                  <dt className="font-semibold">Dove</dt>
                  <dd>{evento.luogo}</dd>
                  <dt className="font-semibold">Prezzo</dt>
                  <dd>{formatPrezzo(evento.prezzo)}</dd>
                  <dt className="font-semibold">Posti</dt>
                  <dd>{evento.postiDisponibili} disponibili su {evento.capienza}</dd>
                </dl>
                {evento.descrizione && <p className="mt-4 whitespace-pre-line text-slate-800">{evento.descrizione}</p>}
                {can(AZIONI.PRENOTATI_VEDI) && (
                  <Link to={`/gestione/eventi/${evento.id}/prenotati`} className="btn-secondary mt-4">
                    Vedi prenotati
                  </Link>
                )}
              </article>
              <div className="lg:col-span-3">
                <PannelloPrenotazione evento={evento} onAggiornaEvento={() => ricarica({ silenzioso: true })} />
              </div>
            </div>
          )}
        </StatoAsync>
      </div>
    </div>
  );
}
