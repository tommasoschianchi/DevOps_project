import { STATI_PAGAMENTO, STATI_PRENOTAZIONE } from '../utils/format';
import { ETICHETTE_TIPO } from '../config/regole';

export function Badge({ classi = 'bg-slate-100 text-slate-800', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classi}`}>
      {children}
    </span>
  );
}

export function BadgeStato({ stato, posizione }) {
  const s = STATI_PRENOTAZIONE[stato] || { etichetta: stato };
  return (
    <Badge classi={s.classi}>
      {s.etichetta}
      {stato === 'lista_attesa' && posizione ? ` (n. ${posizione})` : ''}
    </Badge>
  );
}

export function BadgePagamento({ stato }) {
  const s = STATI_PAGAMENTO[stato] || { etichetta: stato };
  return (
    <Badge classi={s.classi}>
      <span className="sr-only">Pagamento: </span>
      {s.etichetta}
    </Badge>
  );
}

const CLASSI_TIPO = {
  concerto: 'bg-purple-100 text-purple-900',
  workshop: 'bg-teal-100 text-teal-900',
  djset: 'bg-pink-100 text-pink-900',
};

export function BadgeTipo({ tipo }) {
  return <Badge classi={CLASSI_TIPO[tipo]}>{ETICHETTE_TIPO[tipo] || tipo}</Badge>;
}

export function BadgeEventoAnnullato() {
  return <Badge classi="bg-red-100 text-red-800">Annullato</Badge>;
}
