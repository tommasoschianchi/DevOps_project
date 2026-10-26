import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eventiService } from '../../services';
import { messaggioErrore } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AZIONI } from '../../config/permissions';
import StatoAsync from '../../components/StatoAsync';
import ConfirmModal from '../../components/ConfirmModal';
import { BadgeEventoAnnullato, BadgeTipo } from '../../components/Badge';
import { eventoPassato, formatData, formatPrezzo } from '../../utils/format';

const VISTE = {
  attivi: { etichetta: 'In programma', filtro: (e) => e.stato === 'attivo' && !eventoPassato(e) },
  passati: { etichetta: 'Passati', filtro: (e) => e.stato === 'attivo' && eventoPassato(e) },
  annullati: { etichetta: 'Annullati', filtro: (e) => e.stato === 'annullato' },
  tutti: { etichetta: 'Tutti', filtro: () => true },
};

/**
 * Dashboard eventi di collaboratore e admin.
 * UC-06 annulla evento e eliminazione: solo admin (config/permissions.js).
 * US-05: per il collaboratore i pulsanti sono disabilitati con spiegazione; un 403 mostra "Azione non autorizzata".
 */
export default function DashboardEventi() {
  const { can } = useAuth();
  const toast = useToast();
  const { dati, caricamento, errore, ricarica } = useApi(() => eventiService.lista(), []);
  const [vista, setVista] = useState('attivi');
  const [cerca, setCerca] = useState('');
  const [azione, setAzione] = useState(null); // { tipo: 'annulla'|'elimina', evento }
  const [inCorso, setInCorso] = useState(false);

  const puoAnnullare = can(AZIONI.EVENTO_ANNULLA);
  const puoEliminare = can(AZIONI.EVENTO_ELIMINA);

  const eventi = (dati || [])
    .filter(VISTE[vista].filtro)
    .filter((e) => !cerca || `${e.titolo} ${e.luogo}`.toLowerCase().includes(cerca.toLowerCase()));

  const conferma = async () => {
    const { tipo, evento } = azione;
    setInCorso(true);
    try {
      if (tipo === 'annulla') {
        // Flusso del documento: DELETE /eventi/{id} → 204 → conferma e stato "annullato"
        await eventiService.annulla(evento.id);
        toast.successo(`"${evento.titolo}" è stato annullato. I prenotati riceveranno un'email di avviso.`);
      } else {
        await eventiService.elimina(evento.id);
        toast.successo(`"${evento.titolo}" è stato eliminato.`);
      }
      setAzione(null);
      ricarica({ silenzioso: true });
    } catch (e) {
      toast.errore(messaggioErrore(e));
    } finally {
      setInCorso(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Gestione eventi</h1>
        <div className="flex flex-wrap gap-2">
          {can(AZIONI.ISCRIZIONE_APPROVA) && (
            <Link to="/gestione/approvazioni" className="btn-secondary">Iscrizioni da approvare</Link>
          )}
          {can(AZIONI.EVENTO_CREA) && (
            <Link to="/gestione/eventi/nuovo" className="btn-primary">+ Nuovo evento</Link>
          )}
        </div>
      </div>

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="cerca-ev" className="label">Cerca</label>
          <input id="cerca-ev" type="search" className="input" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Titolo o luogo" />
        </div>
        <fieldset>
          <legend className="label">Mostra</legend>
          <div className="flex flex-wrap gap-1">
            {Object.entries(VISTE).map(([k, v]) => (
              <label key={k} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-brand-600 ${vista === k ? 'border-brand-600 bg-brand-50 font-semibold text-brand-800' : 'border-slate-300 bg-white'}`}>
                <input type="radio" name="vista" value={k} checked={vista === k} onChange={() => setVista(k)} className="sr-only" />
                {v.etichetta}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {!puoAnnullare && (
        <p id="nota-permessi" className="text-sm text-slate-700">
          Annullare o eliminare un evento è riservato all'organizzatore principale.
        </p>
      )}

      <StatoAsync
        caricamento={caricamento}
        errore={errore}
        onRiprova={ricarica}
        vuoto={eventi.length === 0}
        messaggioVuoto="Nessun evento in questa vista."
        azioneVuoto={can(AZIONI.EVENTO_CREA) && <Link to="/gestione/eventi/nuovo" className="btn-secondary">Crea il primo evento</Link>}
      >
        <ul className="space-y-3">
          {eventi.map((e) => {
            const attivo = e.stato === 'attivo';
            return (
              <li key={e.id} className="card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BadgeTipo tipo={e.tipo} />
                      {!attivo && <BadgeEventoAnnullato />}
                      <span className="text-xs text-slate-600">{e.categoria} · {formatPrezzo(e.prezzo)}</span>
                    </div>
                    <h2 className="mt-1 font-bold">
                      <Link to={`/eventi/${e.id}`} className="link text-slate-900">{e.titolo}</Link>
                    </h2>
                    <p className="text-sm text-slate-700">{formatData(e.dataOra)} · {e.luogo}</p>
                    <p className="text-sm">
                      <strong>{e.capienza - e.postiDisponibili}</strong> / {e.capienza} posti occupati
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {can(AZIONI.PRENOTATI_VEDI) && (
                      <Link to={`/gestione/eventi/${e.id}/prenotati`} className="btn-secondary btn-sm">
                        Prenotati<span className="sr-only"> di {e.titolo}</span>
                      </Link>
                    )}
                    {can(AZIONI.EVENTO_MODIFICA) && attivo && (
                      <Link to={`/gestione/eventi/${e.id}/modifica`} className="btn-secondary btn-sm">
                        Modifica<span className="sr-only"> {e.titolo}</span>
                      </Link>
                    )}
                    {attivo && (
                      <button
                        type="button"
                        className="btn-secondary btn-sm text-red-800"
                        disabled={!puoAnnullare}
                        aria-describedby={!puoAnnullare ? 'nota-permessi' : undefined}
                        title={!puoAnnullare ? 'Solo l\'organizzatore principale può annullare un evento' : undefined}
                        onClick={() => setAzione({ tipo: 'annulla', evento: e })}
                      >
                        Annulla evento<span className="sr-only"> {e.titolo}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      disabled={!puoEliminare}
                      aria-describedby={!puoEliminare ? 'nota-permessi' : undefined}
                      title={!puoEliminare ? 'Solo l\'organizzatore principale può eliminare un evento' : undefined}
                      onClick={() => setAzione({ tipo: 'elimina', evento: e })}
                    >
                      Elimina<span className="sr-only"> {e.titolo}</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </StatoAsync>

      <ConfirmModal
        aperto={!!azione}
        titolo={azione?.tipo === 'elimina' ? 'Eliminare definitivamente l\'evento?' : 'Annullare l\'evento?'}
        testoConferma={azione?.tipo === 'elimina' ? 'Sì, elimina' : 'Sì, annulla evento'}
        testoAnnulla="Indietro"
        pericoloso
        inCorso={inCorso}
        onConferma={conferma}
        onChiudi={() => setAzione(null)}
      >
        {azione?.tipo === 'elimina' ? (
          <>L'evento <strong>{azione?.evento.titolo}</strong> e tutte le sue prenotazioni verranno cancellati. L'operazione è irreversibile.</>
        ) : (
          <>L'evento <strong>{azione?.evento.titolo}</strong> verrà segnato come annullato e tutti i prenotati riceveranno un avviso via email.</>
        )}
      </ConfirmModal>
    </div>
  );
}
