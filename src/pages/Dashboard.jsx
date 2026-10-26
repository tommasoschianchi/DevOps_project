import { useAuth } from '../context/AuthContext';
import { AZIONI } from '../config/permissions';
import MiePrenotazioni from './partecipante/MiePrenotazioni';
import DashboardEventi from './staff/DashboardEventi';

/** /dashboard: mostra la dashboard del ruolo dell'utente (flusso di login del documento). */
export default function Dashboard() {
  const { can } = useAuth();
  if (can(AZIONI.GESTIONE_EVENTI_VEDI)) return <DashboardEventi />;
  if (can(AZIONI.PRENOTAZIONI_MIE)) return <MiePrenotazioni />;
  return <p>Nessuna dashboard disponibile per il tuo ruolo.</p>;
}
