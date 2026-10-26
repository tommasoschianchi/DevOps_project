import { Link } from 'react-router-dom';
import { BadgeEventoAnnullato, BadgeTipo } from '../Badge';
import { formatData, formatPrezzo } from '../../utils/format';

export default function EventCard({ evento }) {
  const esaurito = evento.postiDisponibili === 0;
  return (
    <article className="card flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <BadgeTipo tipo={evento.tipo} />
        <span className="text-xs text-slate-600">{evento.categoria}</span>
        {evento.stato === 'annullato' && <BadgeEventoAnnullato />}
      </div>
      <h2 className="mt-2 text-lg font-bold leading-snug">
        <Link to={`/eventi/${evento.id}`} className="link text-slate-900">
          {evento.titolo}
        </Link>
      </h2>
      <dl className="mt-2 space-y-1 text-sm text-slate-700">
        <div>
          <dt className="sr-only">Data e ora</dt>
          <dd>{formatData(evento.dataOra)}</dd>
        </div>
        <div>
          <dt className="sr-only">Luogo</dt>
          <dd>{evento.luogo}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between pt-4 text-sm">
        <span className="font-semibold">{formatPrezzo(evento.prezzo)}</span>
        <span className={esaurito ? 'font-semibold text-red-700' : 'text-slate-700'}>
          {esaurito ? 'Esaurito' : `${evento.postiDisponibili} posti liberi`}
        </span>
      </div>
    </article>
  );
}
