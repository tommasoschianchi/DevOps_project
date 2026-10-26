export const STATI_PRENOTAZIONE = {
  confermata: { etichetta: 'Confermata', classi: 'bg-green-100 text-green-800' },
  in_attesa: { etichetta: 'In attesa di approvazione', classi: 'bg-amber-100 text-amber-900' },
  approvata: { etichetta: 'Approvata', classi: 'bg-green-100 text-green-800' },
  lista_attesa: { etichetta: "In lista d'attesa", classi: 'bg-sky-100 text-sky-900' },
  annullata: { etichetta: 'Annullata', classi: 'bg-slate-200 text-slate-700' },
};

export const STATI_PAGAMENTO = {
  non_richiesto: { etichetta: 'Gratuito', classi: 'bg-slate-100 text-slate-700' },
  da_pagare: { etichetta: 'Da pagare', classi: 'bg-red-100 text-red-800' },
  pagato: { etichetta: 'Pagato', classi: 'bg-green-100 text-green-800' },
};

export function formatData(iso, conOra = true) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(conOra ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatPrezzo(prezzo) {
  if (!prezzo) return 'Gratuito';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(prezzo);
}

export const eventoPassato = (evento) => new Date(evento.dataOra).getTime() < Date.now();

/** Valore per <input type="datetime-local"> nel fuso orario locale. */
export function toDatetimeLocal(iso) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function scaricaBlob(blob, nomeFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
