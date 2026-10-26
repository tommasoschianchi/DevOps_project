import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Caricamento } from './StatoAsync';

/**
 * Rotta protetta per ruolo.
 * - Non autenticato → /login con messaggio, poi ritorno alla pagina richiesta.
 * - Autenticato senza permesso → /dashboard con messaggio "accesso non autorizzato".
 */
export default function ProtectedRoute({ azione, children }) {
  const { utente, inizializzato, can } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const avvisato = useRef(false);
  const negato = inizializzato && utente && azione && !can(azione);

  useEffect(() => {
    if (negato && !avvisato.current) {
      avvisato.current = true;
      toast.errore('Non hai i permessi per accedere a quella pagina.');
    }
  }, [negato, toast]);

  if (!inizializzato) return <Caricamento testo="Verifica della sessione…" />;
  if (!utente) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ da: location.pathname, messaggio: 'Accedi per continuare.' }}
      />
    );
  }
  if (negato) return <Navigate to="/dashboard" replace />;
  return children;
}
