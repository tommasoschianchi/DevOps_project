import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventiService } from '../../services';
import { messaggioErrore } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import EventoForm from '../../components/eventi/EventoForm';

/** US-01: creare un evento (messaggio di conferma, l'evento compare nella lista). */
export default function NuovoEvento() {
  const toast = useToast();
  const navigate = useNavigate();
  const [inCorso, setInCorso] = useState(false);
  const [erroriServer, setErroriServer] = useState({});
  const [errore, setErrore] = useState(null);

  const salva = async (evento) => {
    setInCorso(true);
    setErrore(null);
    setErroriServer({});
    try {
      const creato = await eventiService.crea(evento);
      toast.successo(`Evento "${creato.titolo}" creato con successo.`);
      navigate('/dashboard');
    } catch (e) {
      setErroriServer(e.response?.data?.errori || {});
      setErrore(messaggioErrore(e));
    } finally {
      setInCorso(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/dashboard" className="link text-sm">← Torna alla gestione eventi</Link>
      <h1 className="text-2xl font-bold">Nuovo evento</h1>
      {errore && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">{errore}</p>}
      <EventoForm onSalva={salva} inCorso={inCorso} erroriServer={erroriServer} />
    </div>
  );
}
