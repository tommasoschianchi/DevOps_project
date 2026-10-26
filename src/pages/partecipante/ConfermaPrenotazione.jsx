import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { prenotazioniService } from '../../services';
import { useApi } from '../../hooks/useApi';
import StatoAsync from '../../components/StatoAsync';
import { BadgeStato } from '../../components/Badge';
import InfoPagamento from '../../components/prenotazione/InfoPagamento';
import { formatData } from '../../utils/format';

/** Flusso del documento: dopo 201 Created { id } si mostra la pagina di conferma. */
export default function ConfermaPrenotazione() {
  const { id } = useParams();
  const titolo = useRef(null);
  const { dati, caricamento, errore, ricarica } = useApi(
    () => prenotazioniService.mie().then((lista) => lista.find((p) => String(p.id) === String(id)) || null),
    [id],
  );

  useEffect(() => {
    if (dati) titolo.current?.focus();
  }, [dati]);

  const p = dati;
  const workshop = p?.stato === 'in_attesa';

  return (
    <div className="mx-auto max-w-xl">
      <StatoAsync
        caricamento={caricamento}
        errore={errore}
        onRiprova={ricarica}
        vuoto={!p}
        messaggioVuoto="Prenotazione non trovata."
        azioneVuoto={<Link to="/dashboard" className="btn-secondary">Le mie prenotazioni</Link>}
      >
        {p && (
          <section className="card text-center" aria-labelledby="titolo-conferma">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700" aria-hidden="true">✓</div>
            <h1 id="titolo-conferma" ref={titolo} tabIndex={-1} className="mt-4 text-2xl font-bold focus:outline-none">
              {workshop ? 'Richiesta di iscrizione inviata' : p.stato === 'lista_attesa' ? "Sei in lista d'attesa" : 'Prenotazione confermata'}
            </h1>
            {workshop && (
              <p className="mt-2 text-slate-700">
                Un collaboratore deve approvare la tua iscrizione. Riceverai una notifica quando sarà approvata.
              </p>
            )}
            <dl className="mt-6 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-left text-sm">
              <dt className="font-semibold">Evento</dt>
              <dd>{p.evento?.titolo}</dd>
              <dt className="font-semibold">Quando</dt>
              <dd>{formatData(p.evento?.dataOra)}</dd>
              <dt className="font-semibold">Dove</dt>
              <dd>{p.evento?.luogo}</dd>
              {p.posti?.length > 0 && (
                <>
                  <dt className="font-semibold">Posto</dt>
                  <dd>{p.posti.join(', ')}</dd>
                </>
              )}
              <dt className="font-semibold">Stato</dt>
              <dd><BadgeStato stato={p.stato} posizione={p.posizioneListaAttesa} /></dd>
              <dt className="font-semibold">Codice</dt>
              <dd>#{p.id}</dd>
            </dl>
            <div className="text-left">
              <InfoPagamento prenotazione={p} evento={p.evento} />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/dashboard" className="btn-primary">Le mie prenotazioni</Link>
              <Link to="/eventi" className="btn-secondary">Altri eventi</Link>
            </div>
          </section>
        )}
      </StatoAsync>
    </div>
  );
}
