import { useState } from 'react';
import { Link } from 'react-router-dom';
import { prenotazioniService } from '../../services';
import { messaggioErrore } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import StatoAsync from '../../components/StatoAsync';
import { BadgePagamento } from '../../components/Badge';
import { formatData } from '../../utils/format';

/** US-06: approvare le iscrizioni ai workshop in stato "in attesa". */
export default function IscrizioniDaApprovare() {
  const toast = useToast();
  const { dati, caricamento, errore, ricarica } = useApi(() => prenotazioniService.daApprovare(), []);
  const [inCorso, setInCorso] = useState(null);
  const lista = dati || [];

  const approva = async (p) => {
    setInCorso(p.id);
    try {
      await prenotazioniService.approva(p.id);
      toast.successo(`Iscrizione di ${p.utente?.nome} a "${p.evento?.titolo}" approvata. L'utente riceverà una notifica.`);
    } catch (e) {
      toast.errore(messaggioErrore(e));
    } finally {
      setInCorso(null);
      ricarica({ silenzioso: true });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Iscrizioni da approvare</h1>
      <StatoAsync
        caricamento={caricamento}
        errore={errore}
        onRiprova={ricarica}
        vuoto={lista.length === 0}
        messaggioVuoto="Non ci sono iscrizioni in attesa di approvazione."
      >
        <ul className="space-y-3">
          {lista.map((p) => (
            <li key={p.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{p.utente?.nome} <span className="font-normal text-slate-600">· {p.utente?.email}</span></p>
                <p className="text-sm">
                  <Link to={`/gestione/eventi/${p.eventoId}/prenotati`} className="link">{p.evento?.titolo}</Link>
                  {' · '}{formatData(p.evento?.dataOra)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  Richiesta del {formatData(p.creataIl)} <BadgePagamento stato={p.statoPagamento} />
                </p>
              </div>
              <button type="button" className="btn-primary shrink-0" disabled={inCorso === p.id} onClick={() => approva(p)}>
                {inCorso === p.id ? 'Approvazione…' : 'Approva'}
                <span className="sr-only"> iscrizione di {p.utente?.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      </StatoAsync>
    </div>
  );
}
