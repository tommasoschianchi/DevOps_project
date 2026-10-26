import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { eventiService, prenotazioniService } from '../../services';
import { codiceErrore, messaggioErrore } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifiche } from '../../context/NotificheContext';
import { AZIONI } from '../../config/permissions';
import { BIGLIETTI, PAYPAL } from '../../config/regole';
import { eventoPassato, formatPrezzo } from '../../utils/format';
import { BadgeStato } from '../Badge';
import { Caricamento } from '../StatoAsync';
import MappaPosti from './MappaPosti';
import IndicatoreCapienza from './IndicatoreCapienza';

const STATI_ATTIVI = ['confermata', 'in_attesa', 'approvata', 'lista_attesa'];

/**
 * Flusso di prenotazione, diverso per tipo di evento:
 *  - concerto → scelta del posto sulla mappa
 *  - workshop → richiesta di iscrizione "in attesa" di approvazione
 *  - djset    → ingresso fino a capienza
 * Flusso del documento: POST /eventi/{id}/prenota → 201 { id } → pagina di conferma;
 * 409 (posti finiti) → errore + proposta lista d'attesa (US-09).
 */
export default function PannelloPrenotazione({ evento, onAggiornaEvento }) {
  const { utente, can } = useAuth();
  const toast = useToast();
  const { aggiorna: aggiornaNotifiche } = useNotifiche();
  const navigate = useNavigate();
  const location = useLocation();

  const [mie, setMie] = useState(null);
  const [erroreMie, setErroreMie] = useState(null);
  const [posti, setPosti] = useState([]);
  const [quantita, setQuantita] = useState(1);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState(null);
  const [proponiListaAttesa, setProponiListaAttesa] = useState(false);

  const puoPrenotare = can(AZIONI.EVENTO_PRENOTA);

  const caricaMie = useCallback(async () => {
    if (!puoPrenotare) return;
    try {
      setErroreMie(null);
      const lista = await prenotazioniService.mie();
      setMie(lista.filter((p) => p.eventoId === evento.id && STATI_ATTIVI.includes(p.stato)));
    } catch (e) {
      setErroreMie(messaggioErrore(e));
    }
  }, [evento.id, puoPrenotare]);

  useEffect(() => {
    caricaMie();
  }, [caricaMie]);

  // ---- Casi in cui non si può prenotare ----
  if (!utente) {
    return (
      <Riquadro>
        <p className="text-sm text-slate-700">Per prenotare devi accedere al tuo account.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/login" state={{ da: location.pathname }} className="btn-primary">Accedi per prenotare</Link>
          <Link to="/registrazione" className="btn-secondary">Registrati</Link>
        </div>
      </Riquadro>
    );
  }
  if (!puoPrenotare) {
    return <Riquadro><p className="text-sm text-slate-700">Le prenotazioni sono riservate ai partecipanti.</p></Riquadro>;
  }
  if (evento.stato === 'annullato') {
    return <Riquadro><p className="font-medium text-red-800">Questo evento è stato annullato.</p></Riquadro>;
  }
  if (eventoPassato(evento)) {
    return <Riquadro><p className="text-sm text-slate-700">L'evento è già passato: le prenotazioni sono chiuse.</p></Riquadro>;
  }
  if (erroreMie) {
    return <Riquadro><p role="alert" className="text-sm text-red-800">{erroreMie}</p><button type="button" className="btn-secondary btn-sm mt-2" onClick={caricaMie}>Riprova</button></Riquadro>;
  }
  if (!mie) return <Riquadro><Caricamento /></Riquadro>;

  const giaMie = mie.reduce((t, p) => t + p.quantita, 0);
  const restanti = BIGLIETTI.maxPerUtente - giaMie;
  const inLista = mie.find((p) => p.stato === 'lista_attesa');

  if (mie.length && (restanti <= 0 || inLista)) {
    return (
      <Riquadro>
        <p className="text-sm font-medium">Hai già {inLista ? 'una richiesta' : 'una prenotazione'} per questo evento:</p>
        <ul className="mt-2 space-y-1">
          {mie.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
              <BadgeStato stato={p.stato} posizione={p.posizioneListaAttesa} />
              {p.posti?.length > 0 && <span>Posto {p.posti.join(', ')}</span>}
            </li>
          ))}
        </ul>
        <Link to="/dashboard" className="link mt-3 inline-block text-sm">Vai alle mie prenotazioni</Link>
      </Riquadro>
    );
  }

  const maxQuantita = Math.max(1, restanti);
  const esaurito = evento.postiDisponibili < quantita || proponiListaAttesa;
  const qtaEffettiva = evento.tipo === 'concerto' ? posti.length : quantita;

  // ---- Azioni ----
  const togglePosto = (codice) => {
    setErrore(null);
    setPosti((sel) => {
      if (sel.includes(codice)) return sel.filter((c) => c !== codice);
      if (maxQuantita === 1) return [codice];
      return sel.length < maxQuantita ? [...sel, codice] : sel;
    });
  };

  const prenota = async () => {
    setInCorso(true);
    setErrore(null);
    try {
      const body = { quantita: qtaEffettiva, ...(evento.tipo === 'concerto' ? { posti } : {}) };
      const { id } = await eventiService.prenota(evento.id, body);
      aggiornaNotifiche();
      navigate(`/prenotazioni/${id}/conferma`, { state: { appenaCreata: true } });
    } catch (e) {
      const codice = codiceErrore(e);
      setErrore(messaggioErrore(e));
      if (e.response?.status === 409 && codice !== 'LIMITE_BIGLIETTI') {
        if (codice === 'POSTO_OCCUPATO') setPosti([]);
        else setProponiListaAttesa(true);
      }
      toast.errore(messaggioErrore(e));
      onAggiornaEvento();
      caricaMie();
    } finally {
      setInCorso(false);
    }
  };

  const entraInLista = async () => {
    setInCorso(true);
    setErrore(null);
    try {
      await eventiService.entraListaAttesa(evento.id, { quantita });
      toast.successo("Sei in lista d'attesa. Ti avviseremo se si libera un posto.");
      aggiornaNotifiche();
      setProponiListaAttesa(false);
      caricaMie();
    } catch (e) {
      setErrore(messaggioErrore(e));
      toast.errore(messaggioErrore(e));
      if (codiceErrore(e) === 'POSTI_DISPONIBILI') setProponiListaAttesa(false);
      onAggiornaEvento();
    } finally {
      setInCorso(false);
    }
  };

  return (
    <Riquadro>
      {evento.prezzo > 0 && (
        <p className="mb-3 text-sm text-slate-700">
          Ingresso a pagamento: <strong>{formatPrezzo(evento.prezzo)}</strong> a biglietto, tramite PayPal
          {PAYPAL.linkAutomatico ? '.' : ' (istruzioni inviate dall\'organizzatore).'}
        </p>
      )}

      {esaurito ? (
        <div>
          <p className="font-semibold text-red-800">Evento al completo.</p>
          <p className="mt-1 text-sm text-slate-700">
            Puoi entrare in lista d'attesa: se si libera un posto verrai avvisato.
          </p>
          <button type="button" className="btn-primary mt-3 w-full sm:w-auto" onClick={entraInLista} disabled={inCorso}>
            {inCorso ? 'Attendere…' : "Entra in lista d'attesa"}
          </button>
        </div>
      ) : (
        <>
          {evento.tipo === 'concerto' && (
            <MappaPosti
              capienza={evento.capienza}
              postiPerFila={evento.postiPerFila}
              occupati={evento.postiOccupati}
              selezionati={posti}
              onToggle={togglePosto}
              maxSelezionabili={maxQuantita}
              disabilitata={inCorso}
            />
          )}

          {evento.tipo === 'workshop' && (
            <p className="text-sm text-slate-700">
              L'iscrizione richiede la conferma di un collaboratore: dopo l'invio la richiesta resterà
              <strong> "in attesa"</strong> finché non verrà approvata. Riceverai una notifica.
              <span className="mt-1 block">Posti rimasti: <strong>{evento.postiDisponibili}</strong> su {evento.capienza}.</span>
            </p>
          )}

          {evento.tipo === 'djset' && (
            <IndicatoreCapienza disponibili={evento.postiDisponibili} capienza={evento.capienza} />
          )}

          {/* TODO-MARIO: selettore visibile solo se BIGLIETTI.maxPerUtente > 1 */}
          {evento.tipo !== 'concerto' && maxQuantita > 1 && (
            <div className="mt-3 max-w-[10rem]">
              <label htmlFor="quantita" className="label">Numero di biglietti</label>
              <select id="quantita" className="input" value={quantita} onChange={(e) => setQuantita(Number(e.target.value))}>
                {Array.from({ length: Math.min(maxQuantita, evento.postiDisponibili) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {evento.tipo === 'concerto' && (
            <p className="mt-3 text-sm" aria-live="polite">
              {posti.length ? `Posto selezionato: ${posti.join(', ')}` : 'Nessun posto selezionato.'}
            </p>
          )}

          <button
            type="button"
            className="btn-primary mt-4 w-full sm:w-auto"
            onClick={prenota}
            disabled={inCorso || qtaEffettiva < 1}
          >
            {inCorso ? 'Invio in corso…' : evento.tipo === 'workshop' ? 'Richiedi iscrizione' : 'Prenota'}
          </button>
        </>
      )}

      {errore && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">
          {errore}
        </p>
      )}
    </Riquadro>
  );
}

function Riquadro({ children }) {
  return (
    <section aria-labelledby="titolo-prenota" className="card">
      <h2 id="titolo-prenota" className="mb-3 text-lg font-bold">Prenotazione</h2>
      {children}
    </section>
  );
}
