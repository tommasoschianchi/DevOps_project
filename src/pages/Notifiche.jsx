import { Link } from 'react-router-dom';
import { notificheService } from '../services';
import { messaggioErrore } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { useNotifiche } from '../context/NotificheContext';
import StatoAsync from '../components/StatoAsync';
import { formatData } from '../utils/format';

/** Area notifiche in-app (le email sono inviate dal backend). */
export default function Notifiche() {
  const toast = useToast();
  const { aggiorna } = useNotifiche();
  const { dati, caricamento, errore, ricarica, setDati } = useApi(() => notificheService.lista(), []);
  const lista = dati || [];
  const nonLette = lista.filter((n) => !n.letta).length;

  const segnaLetta = async (id) => {
    try {
      await notificheService.segnaLetta(id);
      setDati((l) => l.map((n) => (n.id === id ? { ...n, letta: true } : n)));
      aggiorna();
    } catch (e) {
      toast.errore(messaggioErrore(e));
    }
  };

  const segnaTutte = async () => {
    try {
      await notificheService.segnaTutteLette();
      setDati((l) => l.map((n) => ({ ...n, letta: true })));
      aggiorna();
      toast.successo('Tutte le notifiche sono state segnate come lette.');
    } catch (e) {
      toast.errore(messaggioErrore(e));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notifiche</h1>
        {nonLette > 0 && (
          <button type="button" className="btn-secondary btn-sm" onClick={segnaTutte}>
            Segna tutte come lette
          </button>
        )}
      </div>
      <StatoAsync caricamento={caricamento} errore={errore} onRiprova={ricarica} vuoto={lista.length === 0} messaggioVuoto="Non hai notifiche.">
        <ul className="space-y-2">
          {lista.map((n) => (
            <li key={n.id} className={`card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${n.letta ? '' : 'border-l-4 border-l-brand-600'}`}>
              <div>
                <p className={n.letta ? 'text-slate-700' : 'font-semibold'}>
                  {!n.letta && <span className="sr-only">Non letta: </span>}
                  {n.messaggio}
                </p>
                <p className="text-xs text-slate-600">{formatData(n.creataIl)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {n.link && <Link to={n.link} className="btn-secondary btn-sm" onClick={() => !n.letta && segnaLetta(n.id)}>Apri</Link>}
                {!n.letta && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => segnaLetta(n.id)}>
                    Segna come letta
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </StatoAsync>
    </div>
  );
}
