import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services';
import { codiceErrore, messaggioErrore } from '../../api/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function valida(v) {
  const e = {};
  if (!v.nome.trim()) e.nome = 'Il nome è obbligatorio.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Inserisci un indirizzo email valido.';
  // [PROPOSTA] lunghezza minima password: 8 caratteri
  if (v.password.length < 8) e.password = 'La password deve avere almeno 8 caratteri.';
  if (v.conferma !== v.password) e.conferma = 'Le password non coincidono.';
  return e;
}

/** US-04: registrazione partecipante (errore se l'email esiste già). */
export default function Registrazione() {
  const { utente, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [valori, setValori] = useState({ nome: '', email: '', password: '', conferma: '' });
  const [errori, setErrori] = useState({});
  const [erroreGenerale, setErroreGenerale] = useState(null);
  const [inCorso, setInCorso] = useState(false);

  if (utente) return <Navigate to="/dashboard" replace />;

  const cambia = (campo) => (e) => setValori((v) => ({ ...v, [campo]: e.target.value }));

  const invia = async (e) => {
    e.preventDefault();
    setErroreGenerale(null);
    const err = valida(valori);
    setErrori(err);
    if (Object.keys(err).length) {
      document.getElementById(`reg-${Object.keys(err)[0]}`)?.focus();
      return;
    }
    setInCorso(true);
    try {
      await authService.registra(valori.nome.trim(), valori.email.trim(), valori.password);
      await login(valori.email.trim(), valori.password);
      toast.successo('Registrazione completata. Benvenuto!');
      navigate('/dashboard', { replace: true });
    } catch (err2) {
      if (codiceErrore(err2) === 'EMAIL_ESISTENTE' || err2.response?.status === 409) {
        setErrori({ email: 'Esiste già un account con questa email.' });
        document.getElementById('reg-email')?.focus();
      } else {
        setErrori(err2.response?.data?.errori || {});
        setErroreGenerale(messaggioErrore(err2));
      }
    } finally {
      setInCorso(false);
    }
  };

  const campo = (nome, etichetta, tipo, autoComplete) => (
    <div>
      <label htmlFor={`reg-${nome}`} className="label">{etichetta}</label>
      <input
        id={`reg-${nome}`}
        type={tipo}
        autoComplete={autoComplete}
        className={`input ${errori[nome] ? 'input-errore' : ''}`}
        value={valori[nome]}
        onChange={cambia(nome)}
        required
        aria-invalid={!!errori[nome]}
        aria-describedby={errori[nome] ? `reg-${nome}-errore` : undefined}
      />
      {errori[nome] && <p id={`reg-${nome}-errore`} className="mt-1 text-sm font-medium text-red-700">{errori[nome]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Crea un account</h1>
      <form onSubmit={invia} noValidate className="card space-y-4">
        {campo('nome', 'Nome e cognome', 'text', 'name')}
        {campo('email', 'Email', 'email', 'email')}
        {campo('password', 'Password (almeno 8 caratteri)', 'password', 'new-password')}
        {campo('conferma', 'Conferma password', 'password', 'new-password')}
        {erroreGenerale && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">{erroreGenerale}</p>}
        <button type="submit" className="btn-primary w-full" disabled={inCorso}>
          {inCorso ? 'Registrazione in corso…' : 'Registrati'}
        </button>
        <p className="text-center text-sm text-slate-700">
          Hai già un account? <Link to="/login" className="link">Accedi</Link>
        </p>
      </form>
    </div>
  );
}
