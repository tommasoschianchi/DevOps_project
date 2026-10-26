import { useState } from 'react';
import { Link } from 'react-router-dom';
import { prenotazioniService } from '../../services';
import { messaggioErrore } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { useNotifiche } from '../../context/NotificheContext';
import StatoAsync from '../../components/StatoAsync';
import ConfirmModal from '../../components/ConfirmModal';
import { BadgeEventoAnnullato, BadgeStato, BadgeTipo } from '../../components/Badge';
import InfoPagamento from '../../components/prenotazione/InfoPagamento';
import { eventoPassato, formatData } from '../../utils/format';

/** Dashboard partecipante: "Le mie prenotazioni" + US-10 annullamento con conferma. */
export default function MiePrenotazioni() {
  const toast = useToast();
  const { aggiorna: aggiornaNotifiche } = useNotifiche();
  const { dati, caricamento, errore, ricarica } = useApi(() => prenotazioniService.mie(), []);
  const [daAnnullare, setDaAnnullare] = useState(null);
  const [inCorso, setInCorso] = useState(false);
  const [mostraArchivio, setMostraArchivio] = useState(false);

  const lista = dati || [];
  const attive = lista.filter((p) => p.stato !== 'annullata' && p.evento && !eventoPassato(p.evento));
  const archivio = lista.filter((p) => !attive.includes(p));

  const conferma = async () => {
    setInCorso(true);
    try {
      await prenotazioniService.annulla(daAnnullare.id);
      toast.successo('Prenotazione annullata. Il posto è di nuovo disponibile.');
      setDaAnnullare(null);
      aggiornaNotifiche();
      ricarica({ silenzioso: true });
    } catch (e) {
      toast.errore(messaggioErrore(e));
    } finally {
      setInCorso(false);
    }
  };

  const riga = (p, annullabile) => (
    <li key={p.id} className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <BadgeTipo tipo={p.evento?.tipo} />
            <BadgeStato stato={p.stato} posizione={p.posizioneListaAttesa} />
            {p.evento?.stato === 'annullato' && <BadgeEventoAnnullato />}
          </div>
          <h3 className="mt-2 font-bold">
            {p.evento ? <Link to={`/eventi/${p.evento.id}`} className="link text-slate-900">{p.evento.titolo}</Link> : 'Evento non più disponibile'}
          </h3>
          {p.evento && (
            <p className="text-sm text-slate-700">{formatData(p.evento.dataOra)} · {p.evento.luogo}</p>
          )}
          {p.posti?.length > 0 && <p className="text-sm">Posto: <strong>{p.posti.join(', ')}</strong></p>}
          {p.quantita > 1 && <p className="text-sm">Biglietti: {p.quantita}</p>}
        </div>
        {annullabile && (
          <button type="button" className="btn-secondary btn-sm shrink-0" onClick={() => setDaAnnullare(p)}>
            {p.stato === 'lista_attesa' ? "Esci dalla lista d'attesa" : 'Annulla prenotazione'}
            <span className="sr-only"> per {p.evento?.titolo}</span>
          </button>
        )}
      </div>
      <InfoPagamento prenotazione={p} evento={p.evento} />
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Le mie prenotazioni</h1>
        <Link to="/eventi" className="btn-primary">Scopri gli eventi</Link>
      </div>
      <StatoAsync
        caricamento={caricamento}
        errore={errore}
        onRiprova={ricarica}
        vuoto={lista.length === 0}
        messaggioVuoto="Non hai ancora nessuna prenotazione."
        azioneVuoto={<Link to="/eventi" className="btn-secondary">Vai al catalogo</Link>}
      >
        <section aria-labelledby="titolo-attive">
          <h2 id="titolo-attive" className="mb-3 text-lg font-semibold">Prossimi eventi ({attive.length})</h2>
          {attive.length ? <ul className="space-y-3">{attive.map((p) => riga(p, true))}</ul> : <p className="text-sm text-slate-700">Nessuna prenotazione attiva.</p>}
        </section>
        {archivio.length > 0 && (
          <section aria-labelledby="titolo-archivio" className="mt-8">
            <h2 id="titolo-archivio" className="mb-3 text-lg font-semibold">
              <button type="button" className="link" aria-expanded={mostraArchivio} onClick={() => setMostraArchivio((v) => !v)}>
                Annullate e passate ({archivio.length}) {mostraArchivio ? '▲' : '▼'}
              </button>
            </h2>
            {mostraArchivio && <ul className="space-y-3">{archivio.map((p) => riga(p, false))}</ul>}
          </section>
        )}
      </StatoAsync>

      <ConfirmModal
        aperto={!!daAnnullare}
        titolo="Annullare la prenotazione?"
        testoConferma="Sì, annulla"
        testoAnnulla="No, mantieni"
        pericoloso
        inCorso={inCorso}
        onConferma={conferma}
        onChiudi={() => setDaAnnullare(null)}
      >
        Stai annullando la prenotazione per <strong>{daAnnullare?.evento?.titolo}</strong>
        {daAnnullare?.posti?.length ? ` (posto ${daAnnullare.posti.join(', ')})` : ''}. L'operazione non si può annullare.
        {daAnnullare?.statoPagamento === 'pagato' && ' Per il rimborso contatta l\'organizzatore.'}
      </ConfirmModal>
    </div>
  );
}
