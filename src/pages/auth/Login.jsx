import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { messaggioErrore } from '../../api/client';
import { USE_MOCK } from '../../config/env';

/** US-03: login con email e password → redirect alla dashboard del proprio ruolo. */
export default function Login() {
  const { utente, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState(null);
  const [inCorso, setInCorso] = useState(false);

  const messaggio = location.state?.messaggio;
  const destinazione = location.state?.da && location.state.da !== '/login' ? location.state.da : '/dashboard';

  if (utente) return <Navigate to={destinazione} replace />;

  const invia = async (e) => {
    e.preventDefault();
    setErrore(null);
    if (!email.trim() || !password) {
      setErrore('Inserisci email e password.');
      return;
    }
    setInCorso(true);
    try {
      const me = await login(email.trim(), password);
      toast.successo(`Benvenuto, ${me.nome}!`);
      navigate(destinazione, { replace: true });
    } catch (err) {
      // Flusso del documento: 401 → "credenziali errate"
      setErrore(err.response?.status === 401 ? 'Credenziali errate. Controlla email e password.' : messaggioErrore(err));
    } finally {
      setInCorso(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Accedi</h1>
      {messaggio && (
        <p role="status" className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">{messaggio}</p>
      )}
      <form onSubmit={invia} noValidate className="card space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!!errore} aria-describedby={errore ? 'login-errore' : undefined} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required aria-invalid={!!errore} aria-describedby={errore ? 'login-errore' : undefined} />
        </div>
        {errore && (
          <p id="login-errore" role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">{errore}</p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={inCorso}>
          {inCorso ? 'Accesso in corso…' : 'Accedi'}
        </button>
        <p className="text-center text-sm text-slate-700">
          Non hai un account? <Link to="/registrazione" className="link">Registrati</Link>
        </p>
      </form>
      {USE_MOCK && (
        <details className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <summary className="cursor-pointer font-semibold">Account demo (solo modalità mock)</summary>
          <ul className="mt-2 space-y-1">
            <li>Admin: mario@gestioneeventi.it / admin123</li>
            <li>Collaboratore: giulia@gestioneeventi.it / collab123</li>
            <li>Partecipante: luca@example.com / utente123</li>
          </ul>
        </details>
      )}
    </div>
  );
}
