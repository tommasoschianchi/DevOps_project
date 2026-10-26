import { useState } from 'react';
import { collaboratoriService } from '../../services';
import { codiceErrore, messaggioErrore } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import StatoAsync from '../../components/StatoAsync';
import ConfirmModal from '../../components/ConfirmModal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function valida({ nome, email }) {
  const e = {};
  if (!nome.trim()) e.nome = 'Il nome è obbligatorio.';
  if (!EMAIL_RE.test(email.trim())) e.email = 'Inserisci un indirizzo email valido.';
  return e;
}

function CampiCollaboratore({ prefisso, valori, errori, onCambia }) {
  return (
    <>
      {['nome', 'email'].map((campo) => (
        <div key={campo} className="flex-1">
          <label htmlFor={`${prefisso}-${campo}`} className="label">{campo === 'nome' ? 'Nome e cognome' : 'Email'}</label>
          <input
            id={`${prefisso}-${campo}`}
            type={campo === 'email' ? 'email' : 'text'}
            className={`input ${errori[campo] ? 'input-errore' : ''}`}
            value={valori[campo]}
            onChange={(e) => onCambia({ ...valori, [campo]: e.target.value })}
            aria-invalid={!!errori[campo]}
            aria-describedby={errori[campo] ? `${prefisso}-${campo}-errore` : undefined}
          />
          {errori[campo] && <p id={`${prefisso}-${campo}-errore`} className="mt-1 text-sm font-medium text-red-700">{errori[campo]}</p>}
        </div>
      ))}
    </>
  );
}

/** US-02 registrare un collaboratore + US-08 gestione team (aggiungi, modifica, rimuovi). Solo admin. */
export default function GestioneTeam() {
  const toast = useToast();
  const { dati, caricamento, errore, ricarica } = useApi(() => collaboratoriService.lista(), []);
  const [nuovo, setNuovo] = useState({ nome: '', email: '' });
  const [erroriNuovo, setErroriNuovo] = useState({});
  const [creazione, setCreazione] = useState(false);
  const [credenziali, setCredenziali] = useState(null);
  const [modifica, setModifica] = useState(null); // { id, nome, email }
  const [erroriModifica, setErroriModifica] = useState({});
  const [daRimuovere, setDaRimuovere] = useState(null);
  const [inCorso, setInCorso] = useState(false);

  const lista = dati || [];

  const gestisciErroreEmail = (e, setErrori) => {
    if (codiceErrore(e) === 'EMAIL_ESISTENTE' || e.response?.status === 409) {
      setErrori({ email: 'Esiste già un utente con questa email.' });
    } else {
      setErrori(e.response?.data?.errori || {});
      toast.errore(messaggioErrore(e));
    }
  };

  const aggiungi = async (ev) => {
    ev.preventDefault();
    const err = valida(nuovo);
    setErroriNuovo(err);
    if (Object.keys(err).length) return;
    setCreazione(true);
    try {
      const { collaboratore, passwordTemporanea } = await collaboratoriService.crea(nuovo.nome.trim(), nuovo.email.trim());
      setCredenziali({ ...collaboratore, passwordTemporanea });
      setNuovo({ nome: '', email: '' });
      toast.successo(`${collaboratore.nome} è stato aggiunto al team.`);
      ricarica({ silenzioso: true });
    } catch (e) {
      gestisciErroreEmail(e, setErroriNuovo);
    } finally {
      setCreazione(false);
    }
  };

  const salvaModifica = async () => {
    const err = valida(modifica);
    setErroriModifica(err);
    if (Object.keys(err).length) return;
    setInCorso(true);
    try {
      await collaboratoriService.modifica(modifica.id, { nome: modifica.nome.trim(), email: modifica.email.trim() });
      toast.successo('Dati del collaboratore aggiornati.');
      setModifica(null);
      ricarica({ silenzioso: true });
    } catch (e) {
      gestisciErroreEmail(e, setErroriModifica);
    } finally {
      setInCorso(false);
    }
  };

  const rimuovi = async () => {
    setInCorso(true);
    try {
      await collaboratoriService.rimuovi(daRimuovere.id);
      toast.successo(`${daRimuovere.nome} è stato rimosso dal team.`);
      setDaRimuovere(null);
      ricarica({ silenzioso: true });
    } catch (e) {
      toast.errore(messaggioErrore(e));
    } finally {
      setInCorso(false);
    }
  };

  const copia = async (testo) => {
    try {
      await navigator.clipboard.writeText(testo);
      toast.info('Password copiata negli appunti.');
    } catch {
      toast.errore('Copia non riuscita: seleziona e copia la password manualmente.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestione team</h1>

      <section aria-labelledby="titolo-aggiungi" className="card">
        <h2 id="titolo-aggiungi" className="mb-3 text-lg font-semibold">Aggiungi collaboratore</h2>
        <form onSubmit={aggiungi} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <CampiCollaboratore prefisso="nuovo" valori={nuovo} errori={erroriNuovo} onCambia={setNuovo} />
          <button type="submit" className="btn-primary sm:mt-6" disabled={creazione}>
            {creazione ? 'Creazione…' : 'Aggiungi'}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-600">
          Verrà generata una password temporanea da comunicare al collaboratore.
        </p>
      </section>

      {credenziali && (
        <div role="status" className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-950">
          <p className="font-semibold">Collaboratore creato: {credenziali.nome} ({credenziali.email})</p>
          <p className="mt-1 text-sm">
            Password temporanea: <code className="rounded bg-white px-2 py-0.5 font-mono text-base">{credenziali.passwordTemporanea}</code>
          </p>
          <p className="mt-1 text-xs">Comunicala in modo sicuro: non verrà mostrata di nuovo.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-secondary btn-sm" onClick={() => copia(credenziali.passwordTemporanea)}>Copia password</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setCredenziali(null)}>Chiudi</button>
          </div>
        </div>
      )}

      <section aria-labelledby="titolo-team">
        <h2 id="titolo-team" className="mb-3 text-lg font-semibold">Collaboratori ({lista.length})</h2>
        <StatoAsync caricamento={caricamento} errore={errore} onRiprova={ricarica} vuoto={lista.length === 0} messaggioVuoto="Nessun collaboratore nel team.">
          <ul className="space-y-3">
            {lista.map((c) => (
              <li key={c.id} className="card">
                {modifica?.id === c.id ? (
                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      salvaModifica();
                    }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-start"
                  >
                    <CampiCollaboratore prefisso={`mod-${c.id}`} valori={modifica} errori={erroriModifica} onCambia={setModifica} />
                    <div className="flex gap-2 sm:mt-6">
                      <button type="submit" className="btn-primary" disabled={inCorso}>Salva</button>
                      <button type="button" className="btn-secondary" onClick={() => setModifica(null)} disabled={inCorso}>Annulla</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{c.nome}</p>
                      <p className="text-sm text-slate-700">{c.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setErroriModifica({});
                          setModifica({ id: c.id, nome: c.nome, email: c.email });
                        }}
                      >
                        Modifica<span className="sr-only"> {c.nome}</span>
                      </button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => setDaRimuovere(c)}>
                        Rimuovi<span className="sr-only"> {c.nome}</span>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </StatoAsync>
      </section>

      <ConfirmModal
        aperto={!!daRimuovere}
        titolo="Rimuovere il collaboratore?"
        testoConferma="Sì, rimuovi"
        pericoloso
        inCorso={inCorso}
        onConferma={rimuovi}
        onChiudi={() => setDaRimuovere(null)}
      >
        <strong>{daRimuovere?.nome}</strong> non potrà più accedere all'area di gestione.
      </ConfirmModal>
    </div>
  );
}
