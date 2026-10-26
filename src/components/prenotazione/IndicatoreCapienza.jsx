import { DJSET } from '../../config/regole';

/**
 * DJ set: ingresso "fino a capienza", nessun posto numerato.
 * TODO-MARIO: basta un contatore dei posti o serve altro? (vedi config/regole.js → DJSET)
 */
export default function IndicatoreCapienza({ disponibili, capienza }) {
  const occupati = capienza - disponibili;
  const percentuale = capienza ? Math.round((occupati / capienza) * 100) : 0;
  return (
    <div>
      <p className="text-sm text-slate-800">
        <span className="text-2xl font-bold">{disponibili}</span> posti rimasti su {capienza}
      </p>
      {DJSET.mostraBarra && (
        <div
          className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Riempimento della capienza"
          aria-valuemin={0}
          aria-valuemax={capienza}
          aria-valuenow={occupati}
          aria-valuetext={`${occupati} ingressi prenotati su ${capienza}`}
        >
          <div
            className={`h-full ${percentuale >= 90 ? 'bg-red-600' : percentuale >= 70 ? 'bg-amber-500' : 'bg-green-600'}`}
            style={{ width: `${percentuale}%` }}
          />
        </div>
      )}
    </div>
  );
}
