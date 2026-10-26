/**
 * Gestione uniforme degli stati di una chiamata API: caricamento, errore, lista vuota.
 */
export function Caricamento({ testo = 'Caricamento in corso…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-slate-700">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" aria-hidden="true" />
      <span>{testo}</span>
    </div>
  );
}

export function Errore({ messaggio, onRiprova }) {
  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
      <p className="font-medium">{messaggio}</p>
      {onRiprova && (
        <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => onRiprova()}>
          Riprova
        </button>
      )}
    </div>
  );
}

export function Vuoto({ messaggio, children }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700">
      <p>{messaggio}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Mostra caricamento → errore → vuoto → contenuto, nell'ordine. */
export default function StatoAsync({ caricamento, errore, vuoto, messaggioVuoto, onRiprova, azioneVuoto, children }) {
  if (caricamento) return <Caricamento />;
  if (errore) return <Errore messaggio={errore} onRiprova={onRiprova} />;
  if (vuoto) return <Vuoto messaggio={messaggioVuoto}>{azioneVuoto}</Vuoto>;
  return children;
}
