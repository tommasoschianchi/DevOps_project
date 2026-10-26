import { PAYPAL } from '../../config/regole';
import { formatPrezzo } from '../../utils/format';
import { BadgePagamento } from '../Badge';

/**
 * Entry fee via PayPal: stato "da pagare" / "pagato".
 * TODO-MARIO: link PayPal automatico o gestito a mano? (vedi config/regole.js → PAYPAL)
 */
export default function InfoPagamento({ prenotazione, evento }) {
  if (prenotazione.statoPagamento === 'non_richiesto') return null;
  const importo = (evento?.prezzo || 0) * (prenotazione.quantita || 1);
  const linkPaypal =
    PAYPAL.linkAutomatico && PAYPAL.paypalMeBase ? `${PAYPAL.paypalMeBase.replace(/\/$/, '')}/${importo}EUR` : null;

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
      <p className="flex flex-wrap items-center gap-2">
        Pagamento ({formatPrezzo(importo)}): <BadgePagamento stato={prenotazione.statoPagamento} />
      </p>
      {prenotazione.statoPagamento === 'da_pagare' && prenotazione.stato !== 'annullata' && (
        linkPaypal ? (
          <a href={linkPaypal} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm mt-2">
            Paga con PayPal<span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
        ) : (
          <p className="mt-1 text-slate-700">
            Il pagamento avviene tramite PayPal: riceverai le istruzioni dall'organizzatore. Lo stato diventerà
            "Pagato" quando il pagamento sarà registrato.
          </p>
        )
      )}
    </div>
  );
}
