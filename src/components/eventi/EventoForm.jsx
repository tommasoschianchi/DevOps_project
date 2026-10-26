import { useState } from 'react';
import { CATEGORIE, ETICHETTE_TIPO } from '../../config/regole';
import { toDatetimeLocal } from '../../utils/format';

const VUOTO = {
  titolo: '',
  descrizione: '',
  categoria: CATEGORIE[0],
  tipo: 'concerto',
  luogo: '',
  dataOra: '',
  capienza: '',
  postiPerFila: '10',
  prezzo: '0',
};

export function validaEvento(v) {
  const errori = {};
  if (!v.titolo.trim()) errori.titolo = 'Il titolo è obbligatorio.';
  if (!v.luogo.trim()) errori.luogo = 'Il luogo è obbligatorio.';
  if (!v.dataOra) errori.dataOra = 'Data e ora sono obbligatorie.';
  else if (new Date(v.dataOra).getTime() < Date.now()) errori.dataOra = 'Non puoi creare un evento con una data già passata.';
  const cap = Number(v.capienza);
  if (!Number.isInteger(cap) || cap < 1) errori.capienza = 'Inserisci un numero intero maggiore di 0.';
  if (v.prezzo === '' || Number(v.prezzo) < 0 || Number.isNaN(Number(v.prezzo))) errori.prezzo = 'Il prezzo non può essere negativo (0 = gratuito).';
  if (v.tipo === 'concerto') {
    const ppf = Number(v.postiPerFila);
    if (!Number.isInteger(ppf) || ppf < 1 || ppf > 30) errori.postiPerFila = 'Indica da 1 a 30 posti per fila.';
  }
  return errori;
}

/** US-01: form di creazione/modifica evento con validazione (blocco data passata). */
export default function EventoForm({ iniziale, onSalva, testoInvio = 'Crea evento', erroriServer = {}, inCorso, tipoBloccato }) {
  const [valori, setValori] = useState(() =>
    iniziale
      ? {
          ...VUOTO,
          ...iniziale,
          dataOra: toDatetimeLocal(iniziale.dataOra),
          capienza: String(iniziale.capienza),
          postiPerFila: String(iniziale.postiPerFila || 10),
          prezzo: String(iniziale.prezzo ?? 0),
        }
      : VUOTO,
  );
  const [errori, setErrori] = useState({});
  const [toccato, setToccato] = useState(false);

  const tuttiErrori = { ...erroriServer, ...errori };

  const cambia = (campo) => (e) => {
    const nuovi = { ...valori, [campo]: e.target.value };
    setValori(nuovi);
    if (toccato) setErrori(validaEvento(nuovi));
  };

  const invia = (e) => {
    e.preventDefault();
    setToccato(true);
    const err = validaEvento(valori);
    setErrori(err);
    if (Object.keys(err).length) {
      document.getElementById(`ev-${Object.keys(err)[0]}`)?.focus();
      return;
    }
    onSalva({
      titolo: valori.titolo.trim(),
      descrizione: valori.descrizione.trim(),
      categoria: valori.categoria,
      tipo: valori.tipo,
      luogo: valori.luogo.trim(),
      dataOra: new Date(valori.dataOra).toISOString(),
      capienza: Number(valori.capienza),
      prezzo: Number(valori.prezzo),
      ...(valori.tipo === 'concerto' ? { postiPerFila: Number(valori.postiPerFila) } : {}),
    });
  };

  const campo = (nome, etichetta, input, aiuto) => (
    <div>
      <label htmlFor={`ev-${nome}`} className="label">{etichetta}</label>
      {input}
      {aiuto && !tuttiErrori[nome] && <p id={`ev-${nome}-aiuto`} className="mt-1 text-xs text-slate-600">{aiuto}</p>}
      {tuttiErrori[nome] && (
        <p id={`ev-${nome}-errore`} className="mt-1 text-sm font-medium text-red-700">{tuttiErrori[nome]}</p>
      )}
    </div>
  );

  const attr = (nome, aiuto) => ({
    id: `ev-${nome}`,
    className: `input ${tuttiErrori[nome] ? 'input-errore' : ''}`,
    value: valori[nome],
    onChange: cambia(nome),
    'aria-invalid': !!tuttiErrori[nome],
    'aria-describedby': tuttiErrori[nome] ? `ev-${nome}-errore` : aiuto ? `ev-${nome}-aiuto` : undefined,
  });

  return (
    <form onSubmit={invia} noValidate className="card grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        {campo('titolo', 'Titolo *', <input {...attr('titolo')} required maxLength={120} />)}
      </div>
      <div className="sm:col-span-2">
        {campo('descrizione', 'Descrizione', <textarea {...attr('descrizione')} rows={4} maxLength={2000} />)}
      </div>
      {campo(
        'tipo',
        'Tipo di evento *',
        <select {...attr('tipo', tipoBloccato)} disabled={!!tipoBloccato}>
          {Object.entries(ETICHETTE_TIPO).map(([v, t]) => (
            <option key={v} value={v}>{t}</option>
          ))}
        </select>,
        tipoBloccato ||
          (valori.tipo === 'concerto'
            ? 'Posti numerati: il partecipante sceglie il posto sulla mappa.'
            : valori.tipo === 'workshop'
              ? 'Le iscrizioni restano "in attesa" fino all\'approvazione.'
              : 'Ingresso fino a capienza, senza posti numerati.'),
      )}
      {campo(
        'categoria',
        'Categoria',
        <select {...attr('categoria')}>
          {CATEGORIE.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>,
      )}
      <div className="sm:col-span-2">
        {campo('luogo', 'Luogo *', <input {...attr('luogo')} required maxLength={200} placeholder="Es. Teatro Comunale, Bologna" />)}
      </div>
      {campo('dataOra', 'Data e ora *', <input {...attr('dataOra')} type="datetime-local" required min={toDatetimeLocal()} />)}
      {campo('capienza', 'Capienza massima *', <input {...attr('capienza')} type="number" min="1" step="1" inputMode="numeric" required />)}
      {valori.tipo === 'concerto' &&
        campo(
          'postiPerFila',
          'Posti per fila *',
          <input {...attr('postiPerFila', true)} type="number" min="1" max="30" step="1" inputMode="numeric" required />,
          valori.capienza && Number(valori.postiPerFila) > 0
            ? `${Math.ceil(Number(valori.capienza) / Number(valori.postiPerFila))} file (A, B, C…)`
            : 'Usato per disegnare la mappa dei posti.',
        )}
      {campo(
        'prezzo',
        'Prezzo (€)',
        <input {...attr('prezzo', true)} type="number" min="0" step="0.5" inputMode="decimal" />,
        '0 = evento gratuito. Se > 0 il pagamento avviene tramite PayPal.',
      )}
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
        <button type="submit" className="btn-primary" disabled={inCorso}>
          {inCorso ? 'Salvataggio…' : testoInvio}
        </button>
      </div>
    </form>
  );
}
