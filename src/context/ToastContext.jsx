import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const STILI = {
  successo: 'border-green-600 bg-green-50 text-green-900',
  errore: 'border-red-600 bg-red-50 text-red-900',
  info: 'border-brand-600 bg-brand-50 text-brand-800',
};

/** Conferme visive per ogni azione (US: messaggi chiari di conferma e di errore). */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState([]);

  const chiudi = useCallback((id) => setToast((t) => t.filter((x) => x.id !== id)), []);

  const mostra = useCallback(
    (tipo, messaggio) => {
      const id = Date.now() + Math.random();
      setToast((t) => [...t, { id, tipo, messaggio }]);
      setTimeout(() => chiudi(id), tipo === 'errore' ? 7000 : 4500);
    },
    [chiudi],
  );

  const api = useMemo(
    () => ({
      successo: (m) => mostra('successo', m),
      errore: (m) => mostra('errore', m),
      info: (m) => mostra('info', m),
    }),
    [mostra],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col items-center gap-2 sm:left-auto sm:items-end">
        <div aria-live="polite" role="status" className="flex w-full flex-col gap-2 sm:w-96">
          {toast.map((t) => (
            <div
              key={t.id}
              role={t.tipo === 'errore' ? 'alert' : undefined}
              className={`flex items-start justify-between gap-3 rounded-lg border-l-4 p-3 shadow-lg ${STILI[t.tipo]}`}
            >
              <p className="text-sm font-medium">{t.messaggio}</p>
              <button
                type="button"
                onClick={() => chiudi(t.id)}
                className="rounded px-1 text-lg leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-label="Chiudi messaggio"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
