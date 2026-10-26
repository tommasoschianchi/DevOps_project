import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { eventiService } from '../../services';
import { messaggioErrore } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import StatoAsync from '../../components/StatoAsync';
import EventoForm from '../../components/eventi/EventoForm';

/** Modifica evento (stesse validazioni di US-01). */
export default function ModificaEvento() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const { dati: evento, caricamento, errore, ricarica } = useApi(() => eventiService.dettaglio(id), [id]);
  const [inCorso, setInCorso] = useState(false);
  const [erroriServer, setErroriServer] = useState({});
  const [erroreSalva, setErroreSalva] = useState(null);

  const salva = async (dati) => {
    setInCorso(true);
    setErroreSalva(null);
    setErroriServer({});
    try {
      await eventiService.modifica(id, dati);
      toast.successo('Modifiche salvate.');
      navigate('/dashboard');
    } catch (e) {
      setErroriServer(e.response?.data?.errori || {});
      setErroreSalva(messaggioErrore(e));
    } finally {
      setInCorso(false);
    }
  };

  const conPrenotazioni = evento && evento.postiDisponibili < evento.capienza;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/dashboard" className="link text-sm">← Torna alla gestione eventi</Link>
      <h1 className="text-2xl font-bold">Modifica evento</h1>
      <StatoAsync caricamento={caricamento} errore={errore} onRiprova={ricarica}>
        {evento?.stato === 'annullato' ? (
          <p className="card">Questo evento è stato annullato e non può essere modificato.</p>
        ) : (
          evento && (
            <>
              {erroreSalva && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">{erroreSalva}</p>}
              <EventoForm
                iniziale={evento}
                onSalva={salva}
                inCorso={inCorso}
                erroriServer={erroriServer}
                testoInvio="Salva modifiche"
                tipoBloccato={conPrenotazioni ? 'Il tipo non si può cambiare: ci sono già prenotazioni.' : null}
              />
            </>
          )
        )}
      </StatoAsync>
    </div>
  );
}
