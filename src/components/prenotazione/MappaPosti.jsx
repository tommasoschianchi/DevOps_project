/**
 * Concerto: griglia dei posti numerati (file A, B, C… × posti per fila).
 * I posti occupati sono disabilitati; navigabile da tastiera (Tab/Invio/Spazio).
 */
export function generaFile(capienza, postiPerFila) {
  const file = [];
  const numFile = Math.ceil(capienza / postiPerFila);
  for (let r = 0; r < numFile; r++) {
    const lettera = String.fromCharCode(65 + r);
    const posti = [];
    for (let c = 1; c <= postiPerFila && r * postiPerFila + c <= capienza; c++) posti.push(`${lettera}${c}`);
    file.push({ lettera, posti });
  }
  return file;
}

export default function MappaPosti({ capienza, postiPerFila, occupati = [], selezionati, onToggle, maxSelezionabili, disabilitata }) {
  const presi = new Set(occupati);
  const file = generaFile(capienza, postiPerFila);

  return (
    <fieldset disabled={disabilitata}>
      <legend className="label">
        Scegli {maxSelezionabili > 1 ? `fino a ${maxSelezionabili} posti` : 'il tuo posto'}
      </legend>
      <div className="mb-3 rounded bg-slate-800 py-1 text-center text-xs font-semibold uppercase tracking-wider text-white" aria-hidden="true">
        Palco
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex min-w-full flex-col items-center gap-1.5">
          {file.map((fila) => (
            <div key={fila.lettera} role="group" aria-label={`Fila ${fila.lettera}`} className="flex items-center gap-1.5">
              <span className="w-5 text-center text-xs font-bold text-slate-600" aria-hidden="true">{fila.lettera}</span>
              {fila.posti.map((codice) => {
                const occupato = presi.has(codice);
                const scelto = selezionati.includes(codice);
                const pieno = !scelto && selezionati.length >= maxSelezionabili && maxSelezionabili > 1;
                return (
                  <button
                    key={codice}
                    type="button"
                    disabled={occupato || pieno}
                    aria-pressed={scelto}
                    aria-label={`Posto ${codice}, ${occupato ? 'occupato' : scelto ? 'selezionato' : 'libero'}`}
                    onClick={() => onToggle(codice)}
                    className={`h-9 w-9 shrink-0 rounded-md border text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 ${
                      occupato
                        ? 'cursor-not-allowed border-slate-300 bg-slate-300 text-slate-500 line-through'
                        : scelto
                          ? 'border-brand-700 bg-brand-600 text-white'
                          : 'border-green-700 bg-white text-green-800 hover:bg-green-50'
                    }`}
                  >
                    {codice.slice(1)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-slate-700" aria-label="Legenda">
        <li className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-green-700 bg-white" aria-hidden="true" /> Libero</li>
        <li className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-brand-600" aria-hidden="true" /> Selezionato</li>
        <li className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-slate-300" aria-hidden="true" /> Occupato</li>
      </ul>
    </fieldset>
  );
}
