import { useEffect, useState } from 'react';
import { CATEGORIE, ETICHETTE_TIPO } from '../../config/regole';

export const FILTRI_VUOTI = { q: '', tipo: '', categoria: '', luogo: '', dal: '', al: '' };

/** US-07: ricerca + filtri per data, tipo/categoria e luogo. */
export default function FiltriEventi({ valori, onCambia }) {
  const [bozza, setBozza] = useState(valori);

  useEffect(() => setBozza(valori), [valori]);

  // I campi di testo applicano il filtro dopo una breve pausa di digitazione
  useEffect(() => {
    const t = setTimeout(() => {
      if (bozza.q !== valori.q || bozza.luogo !== valori.luogo) onCambia(bozza);
    }, 400);
    return () => clearTimeout(t);
  }, [bozza, valori, onCambia]);

  const cambia = (campo, immediato) => (e) => {
    const nuovo = { ...bozza, [campo]: e.target.value };
    setBozza(nuovo);
    if (immediato) onCambia(nuovo);
  };

  const attivi = Object.values(valori).some(Boolean);

  return (
    <form role="search" aria-label="Filtra eventi" className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={(e) => { e.preventDefault(); onCambia(bozza); }}>
      <div className="sm:col-span-2">
        <label htmlFor="f-q" className="label">Cerca</label>
        <input id="f-q" type="search" className="input" placeholder="Titolo, descrizione…" value={bozza.q} onChange={cambia('q')} />
      </div>
      <div>
        <label htmlFor="f-tipo" className="label">Tipo</label>
        <select id="f-tipo" className="input" value={bozza.tipo} onChange={cambia('tipo', true)}>
          <option value="">Tutti</option>
          {Object.entries(ETICHETTE_TIPO).map(([v, t]) => (
            <option key={v} value={v}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-cat" className="label">Categoria</label>
        <select id="f-cat" className="input" value={bozza.categoria} onChange={cambia('categoria', true)}>
          <option value="">Tutte</option>
          {CATEGORIE.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="f-luogo" className="label">Luogo</label>
        <input id="f-luogo" className="input" placeholder="Città o locale" value={bozza.luogo} onChange={cambia('luogo')} />
      </div>
      <div>
        <label htmlFor="f-dal" className="label">Dal</label>
        <input id="f-dal" type="date" className="input" value={bozza.dal} onChange={cambia('dal', true)} />
      </div>
      <div>
        <label htmlFor="f-al" className="label">Al</label>
        <input id="f-al" type="date" className="input" value={bozza.al} min={bozza.dal || undefined} onChange={cambia('al', true)} />
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        {attivi && (
          <button type="button" className="btn-secondary" onClick={() => onCambia(FILTRI_VUOTI)}>
            Azzera filtri
          </button>
        )}
      </div>
    </form>
  );
}
