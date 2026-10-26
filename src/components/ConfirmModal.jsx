import { useEffect, useId, useRef } from 'react';

/**
 * Modale di conferma accessibile: focus iniziale sul pulsante "Annulla",
 * Esc per chiudere, focus intrappolato nella finestra, focus restituito alla chiusura.
 */
export default function ConfirmModal({
  aperto,
  titolo,
  children,
  testoConferma = 'Conferma',
  testoAnnulla = 'Annulla',
  pericoloso = false,
  inCorso = false,
  onConferma,
  onChiudi,
}) {
  const idTitolo = useId();
  const idDescr = useId();
  const finestra = useRef(null);
  const annullaRef = useRef(null);
  const chiudiRef = useRef(onChiudi);
  chiudiRef.current = inCorso ? () => {} : onChiudi;

  useEffect(() => {
    if (!aperto) return undefined;
    const precedente = document.activeElement;
    annullaRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') chiudiRef.current();
      if (e.key === 'Tab') {
        const focusabili = finestra.current.querySelectorAll('button:not([disabled])');
        if (!focusabili.length) return;
        const primo = focusabili[0];
        const ultimo = focusabili[focusabili.length - 1];
        if (e.shiftKey && document.activeElement === primo) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primo.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      precedente?.focus?.();
    };
  }, [aperto]);

  if (!aperto) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/60 p-4 sm:items-center">
      <div
        ref={finestra}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitolo}
        aria-describedby={idDescr}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id={idTitolo} className="text-lg font-bold">
          {titolo}
        </h2>
        <div id={idDescr} className="mt-2 text-sm text-slate-700">
          {children}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={annullaRef} type="button" className="btn-secondary" onClick={onChiudi} disabled={inCorso}>
            {testoAnnulla}
          </button>
          <button
            type="button"
            className={pericoloso ? 'btn-danger' : 'btn-primary'}
            onClick={onConferma}
            disabled={inCorso}
          >
            {inCorso ? 'Attendere…' : testoConferma}
          </button>
        </div>
      </div>
    </div>
  );
}
