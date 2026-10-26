import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventiService, prenotazioniService } from '../../services';
import { messaggioErrore } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AZIONI } from '../../config/permissions';
import StatoAsync from '../../components/StatoAsync';
import { BadgeEventoAnnullato, BadgePagamento, BadgeStato, BadgeTipo } from '../../components/Badge';
import { formatData, scaricaBlob, STATI_PRENOTAZIONE } from '../../utils/format';

/**
 * Lista prenotati di un evento (solo staff).
 * US-06 approvazione iscrizioni, UC-08 pagamento ricevuto, US-11/UC-13 export CSV.
 */
export default function ListaPrenotati() {
  const { id } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const evento = useApi(() => eventiService.dettaglio(id), [id]);
  const prenotati = useApi(() => eventiService.prenotati(id), [id]);
  const [filtroStato, setFiltroStato] = useState('');
  const [inCorso, setInCorso] = useState(null); // id della prenotazione in lavorazione
  const [esportando, setEsportando] = useState(false);

  const lista = (prenotati.dati || []).filter((p) => !filtroStato || p.stato === filtroStato);
  const conteggio = (stato) => (prenotati.dati || []).filter((p) => p.stato === stato).length;

  const aggiorna = () => {
    prenotati.ricarica({ silenzioso: true });
    evento.ricarica({ silenzioso: true });
  };

  const esegui = async (p, azione) => {
    setInCorso(p.id);
    try {
      if (azione === 'approva') {
        await prenotazioniService.approva(p.id);
        toast.successo(`Iscrizione di ${p.utente?.nome} approvata. L'utente riceverà una notifica.`);
      } else {
        await prenotazioniService.segnaPagato(p.id);
        toast.successo(`Pagamento di ${p.utente?.nome} segnato come ricevuto.`);
      }
      aggiorna();
    } catch (e) {
      toast.errore(messaggioErrore(e));
      aggiorna();
    } finally {
      setInCorso(null);
    }
  };

  const esporta = async () => {
    setEsportando(true);
    try {
      const blob = await eventiService.esportaCsv(id);
      const nome = (evento.dati?.titolo || `evento-${id}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      scaricaBlob(blob, `prenotati-${nome}.csv`);
      toast.successo('File CSV scaricato.');
    } catch (e) {
      toast.errore(messaggioErrore(e));
    } finally {
      setEsportando(false);
    }
  };

  const e = evento.dati;

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="link text-sm">← Torna alla gestione eventi</Link>
      <StatoAsync caricamento={evento.caricamento && !e} errore={evento.errore} onRiprova={evento.ricarica}>
        {e && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BadgeTipo tipo={e.tipo} />
                {e.stato === 'annullato' && <BadgeEventoAnnullato />}
              </div>
              <h1 className="mt-1 text-2xl font-bold">Prenotati: {e.titolo}</h1>
              <p className="text-sm text-slate-700">{formatData(e.dataOra)} · {e.luogo}</p>
              <p className="text-sm"><strong>{e.capienza - e.postiDisponibili}</strong> / {e.capienza} posti occupati</p>
            </div>
            {can(AZIONI.PRENOTATI_ESPORTA_CSV) && (
              <button type="button" className="btn-secondary" onClick={esporta} disabled={esportando || !prenotati.dati?.length}>
                {esportando ? 'Esportazione…' : 'Esporta CSV'}
              </button>
            )}
          </div>
        )}
      </StatoAsync>

      <div className="max-w-xs">
        <label htmlFor="filtro-stato" className="label">Filtra per stato</label>
        <select id="filtro-stato" className="input" value={filtroStato} onChange={(ev) => setFiltroStato(ev.target.value)}>
          <option value="">Tutti ({prenotati.dati?.length || 0})</option>
          {Object.entries(STATI_PRENOTAZIONE).map(([k, v]) => (
            <option key={k} value={k}>{v.etichetta} ({conteggio(k)})</option>
          ))}
        </select>
      </div>

      <StatoAsync
        caricamento={prenotati.caricamento}
        errore={prenotati.errore}
        onRiprova={prenotati.ricarica}
        vuoto={lista.length === 0}
        messaggioVuoto={filtroStato ? 'Nessuna prenotazione in questo stato.' : 'Nessuno si è ancora prenotato.'}
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Elenco dei prenotati all'evento</caption>
            <thead className="bg-slate-50 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Partecipante</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stato</th>
                <th scope="col" className="px-4 py-3 font-semibold">Pagamento</th>
                <th scope="col" className="px-4 py-3 font-semibold">Posto / Qtà</th>
                <th scope="col" className="px-4 py-3 font-semibold">Prenotato il</th>
                <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Azioni</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.utente?.nome}</div>
                    <div className="text-slate-600">{p.utente?.email}</div>
                  </td>
                  <td className="px-4 py-3"><BadgeStato stato={p.stato} posizione={p.posizioneListaAttesa} /></td>
                  <td className="px-4 py-3"><BadgePagamento stato={p.statoPagamento} /></td>
                  <td className="px-4 py-3">{p.posti?.length ? p.posti.join(', ') : p.quantita}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatData(p.creataIl)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {p.stato === 'in_attesa' && can(AZIONI.ISCRIZIONE_APPROVA) && (
                        <button type="button" className="btn-primary btn-sm" disabled={inCorso === p.id} onClick={() => esegui(p, 'approva')}>
                          Approva<span className="sr-only"> {p.utente?.nome}</span>
                        </button>
                      )}
                      {p.statoPagamento === 'da_pagare' && p.stato !== 'annullata' && p.stato !== 'lista_attesa' && can(AZIONI.PAGAMENTO_SEGNA) && (
                        <button type="button" className="btn-secondary btn-sm" disabled={inCorso === p.id} onClick={() => esegui(p, 'paga')}>
                          Segna pagato<span className="sr-only"> per {p.utente?.nome}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatoAsync>
    </div>
  );
}
