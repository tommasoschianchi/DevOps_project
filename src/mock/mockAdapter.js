/**
 * Adapter Axios che simula il backend in memoria (persistito in localStorage).
 * Rispetta gli stessi endpoint (api/endpoints.js), codici HTTP e controlli di ruolo
 * che il backend reale dovrà applicare, così il passaggio alle API vere è solo configurazione.
 */
import { AxiosError } from 'axios';
import { creaDatiIniziali } from './data';
import { BIGLIETTI } from '../config/regole';
import { can, AZIONI } from '../config/permissions';

const DB_KEY = 'ge_mock_db_v1';
const LATENZA_MS = 350;
const STATI_ATTIVI = ['confermata', 'in_attesa', 'approvata'];

// ---------- Persistenza ----------
let db = carica();

function carica() {
  try {
    const salvato = localStorage.getItem(DB_KEY);
    if (salvato) return JSON.parse(salvato);
  } catch {
    /* storage non disponibile: si riparte dai dati iniziali */
  }
  return creaDatiIniziali();
}

function salva() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage non disponibile: i dati restano solo in memoria */
  }
}

export function resetMock() {
  db = creaDatiIniziali();
  salva();
}

// ---------- Utility ----------
const nuovoId = (lista) => lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;
const ora = () => new Date().toISOString();

class HttpErr extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const b64url = (obj) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

function creaToken(utente) {
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600;
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: utente.id, ruolo: utente.ruolo, exp })}.mock`;
}

function utenteDaToken(headers) {
  const auth = headers?.Authorization || headers?.authorization || headers?.get?.('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp * 1000 < Date.now()) return null;
    return db.utenti.find((u) => u.id === payload.sub) || null;
  } catch {
    return null;
  }
}

const pubblico = ({ password, ...u }) => u;
const datiUtente = (id) => {
  const u = db.utenti.find((x) => x.id === id);
  return u ? { id: u.id, nome: u.nome, email: u.email } : null;
};

function occupati(eventoId) {
  return db.prenotazioni
    .filter((p) => p.eventoId === eventoId && STATI_ATTIVI.includes(p.stato))
    .reduce((tot, p) => tot + p.quantita, 0);
}

function conDisponibilita(evento) {
  const out = { ...evento, postiDisponibili: Math.max(0, evento.capienza - occupati(evento.id)) };
  if (evento.tipo === 'concerto') {
    out.postiOccupati = db.prenotazioni
      .filter((p) => p.eventoId === evento.id && STATI_ATTIVI.includes(p.stato))
      .flatMap((p) => p.posti);
  }
  return out;
}

function trovaEvento(id) {
  const e = db.eventi.find((x) => x.id === Number(id));
  if (!e) throw new HttpErr(404, 'Evento non trovato.');
  return e;
}

function trovaPrenotazione(id) {
  const p = db.prenotazioni.find((x) => x.id === Number(id));
  if (!p) throw new HttpErr(404, 'Prenotazione non trovata.');
  return p;
}

function notifica(utenteId, messaggio, link = '/dashboard') {
  db.notifiche.push({ id: nuovoId(db.notifiche), utenteId, messaggio, letta: false, creataIl: ora(), link });
}

function richiedi(utente, azione) {
  if (!utente) throw new HttpErr(401, 'Autenticazione richiesta.');
  if (!can(utente.ruolo, azione)) throw new HttpErr(403, 'Azione non autorizzata.');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validaEvento(body, esistente) {
  const errori = {};
  if (!body.titolo?.trim()) errori.titolo = 'Il titolo è obbligatorio.';
  if (!['concerto', 'workshop', 'djset'].includes(body.tipo)) errori.tipo = 'Tipo di evento non valido.';
  if (!body.luogo?.trim()) errori.luogo = 'Il luogo è obbligatorio.';
  const data = new Date(body.dataOra);
  if (!body.dataOra || Number.isNaN(data.getTime())) errori.dataOra = 'Data e ora sono obbligatorie.';
  else if (data.getTime() < Date.now()) errori.dataOra = 'Non puoi creare un evento con una data già passata.';
  const capienza = Number(body.capienza);
  if (!Number.isInteger(capienza) || capienza < 1) errori.capienza = 'La capienza deve essere un numero intero maggiore di 0.';
  else if (esistente && capienza < occupati(esistente.id))
    errori.capienza = `Ci sono già ${occupati(esistente.id)} posti prenotati: la capienza non può essere inferiore.`;
  if (Number(body.prezzo) < 0 || Number.isNaN(Number(body.prezzo))) errori.prezzo = 'Il prezzo non può essere negativo.';
  if (body.tipo === 'concerto') {
    const ppf = Number(body.postiPerFila);
    if (!Number.isInteger(ppf) || ppf < 1 || ppf > 30) errori.postiPerFila = 'Indica da 1 a 30 posti per fila.';
  }
  if (Object.keys(errori).length) throw new HttpErr(422, 'Controlla i campi evidenziati.', { errori });
  return {
    titolo: body.titolo.trim(),
    descrizione: body.descrizione?.trim() || '',
    categoria: body.categoria || 'Altro',
    tipo: body.tipo,
    luogo: body.luogo.trim(),
    dataOra: data.toISOString(),
    capienza,
    prezzo: Number(body.prezzo) || 0,
    ...(body.tipo === 'concerto' ? { postiPerFila: Number(body.postiPerFila) } : {}),
  };
}

function codiciPostiValidi(evento) {
  const file = Math.ceil(evento.capienza / evento.postiPerFila);
  const codici = new Set();
  for (let r = 0; r < file; r++) {
    for (let c = 1; c <= evento.postiPerFila; c++) {
      if (r * evento.postiPerFila + c <= evento.capienza) codici.add(`${String.fromCharCode(65 + r)}${c}`);
    }
  }
  return codici;
}

function csv(righe) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + righe.map((r) => r.map(esc).join(';')).join('\r\n');
}

// ---------- Rotte ----------
const rotte = [];
const rotta = (metodo, percorso, handler) => {
  const regex = new RegExp('^' + percorso.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$');
  rotte.push({ metodo, regex, handler });
};

// Auth
rotta('post', '/api/auth/login', ({ body }) => {
  const u = db.utenti.find(
    (x) => x.email.toLowerCase() === String(body.email || '').toLowerCase() && x.password === body.password,
  );
  if (!u) throw new HttpErr(401, 'Credenziali errate.');
  return [200, { token: creaToken(u), ruolo: u.ruolo }];
});

rotta('post', '/api/auth/register', ({ body }) => {
  const errori = {};
  if (!body.nome?.trim()) errori.nome = 'Il nome è obbligatorio.';
  if (!EMAIL_RE.test(body.email || '')) errori.email = 'Email non valida.';
  if (!body.password || body.password.length < 8) errori.password = 'La password deve avere almeno 8 caratteri.';
  if (Object.keys(errori).length) throw new HttpErr(422, 'Controlla i campi evidenziati.', { errori });
  if (db.utenti.some((u) => u.email.toLowerCase() === body.email.toLowerCase()))
    throw new HttpErr(409, 'Esiste già un account con questa email.', { codice: 'EMAIL_ESISTENTE' });
  const u = { id: nuovoId(db.utenti), nome: body.nome.trim(), email: body.email.trim(), password: body.password, ruolo: 'partecipante' };
  db.utenti.push(u);
  return [201, { id: u.id }];
});

rotta('get', '/api/auth/me', ({ utente }) => {
  if (!utente) throw new HttpErr(401, 'Autenticazione richiesta.');
  return [200, pubblico(utente)];
});

// Eventi
rotta('get', '/api/eventi', ({ query }) => {
  const q = (query.q || '').toLowerCase();
  const luogo = (query.luogo || '').toLowerCase();
  let lista = db.eventi.filter((e) => {
    if (q && !`${e.titolo} ${e.descrizione} ${e.luogo}`.toLowerCase().includes(q)) return false;
    if (query.tipo && e.tipo !== query.tipo) return false;
    if (query.categoria && e.categoria !== query.categoria) return false;
    if (luogo && !e.luogo.toLowerCase().includes(luogo)) return false;
    const giorno = e.dataOra.slice(0, 10);
    if (query.dal && giorno < query.dal) return false;
    if (query.al && giorno > query.al) return false;
    return true;
  });
  lista = lista.sort((a, b) => a.dataOra.localeCompare(b.dataOra)).map(conDisponibilita);
  return [200, lista];
});

rotta('get', '/api/eventi/:id', ({ params }) => [200, conDisponibilita(trovaEvento(params.id))]);

rotta('post', '/api/eventi', ({ utente, body }) => {
  richiedi(utente, AZIONI.EVENTO_CREA);
  const e = { id: nuovoId(db.eventi), ...validaEvento(body), stato: 'attivo' };
  db.eventi.push(e);
  return [201, conDisponibilita(e)];
});

rotta('put', '/api/eventi/:id', ({ utente, params, body }) => {
  richiedi(utente, AZIONI.EVENTO_MODIFICA);
  const e = trovaEvento(params.id);
  if (e.stato === 'annullato') throw new HttpErr(409, 'Un evento annullato non può essere modificato.');
  if (body.tipo !== e.tipo && occupati(e.id) > 0)
    throw new HttpErr(422, 'Non puoi cambiare il tipo di un evento con prenotazioni attive.', { errori: { tipo: 'Tipo non modificabile.' } });
  Object.assign(e, validaEvento(body, e));
  return [200, conDisponibilita(e)];
});

rotta('delete', '/api/eventi/:id', ({ utente, params, query }) => {
  const definitivo = String(query.definitivo) === 'true';
  richiedi(utente, definitivo ? AZIONI.EVENTO_ELIMINA : AZIONI.EVENTO_ANNULLA);
  const e = trovaEvento(params.id);
  const coinvolte = db.prenotazioni.filter((p) => p.eventoId === e.id && p.stato !== 'annullata');
  if (definitivo) {
    db.eventi = db.eventi.filter((x) => x.id !== e.id);
    db.prenotazioni = db.prenotazioni.filter((p) => p.eventoId !== e.id);
    coinvolte.forEach((p) => notifica(p.utenteId, `L'evento "${e.titolo}" è stato eliminato.`));
  } else {
    if (e.stato === 'annullato') throw new HttpErr(409, 'L\'evento è già annullato.');
    e.stato = 'annullato';
    coinvolte.forEach((p) => {
      p.stato = 'annullata';
      // Nel sistema reale qui parte anche l'email (SendGrid, asincrona)
      notifica(p.utenteId, `L'evento "${e.titolo}" è stato annullato.`);
    });
  }
  return [204, null];
});

// Prenotazioni
rotta('post', '/api/eventi/:id/prenota', ({ utente, params, body }) => {
  richiedi(utente, AZIONI.EVENTO_PRENOTA);
  const e = trovaEvento(params.id);
  if (e.stato !== 'attivo') throw new HttpErr(409, 'L\'evento è stato annullato.', { codice: 'EVENTO_ANNULLATO' });
  if (new Date(e.dataOra) < new Date()) throw new HttpErr(409, 'L\'evento è già passato.', { codice: 'EVENTO_PASSATO' });
  const quantita = Number(body.quantita) || 1;
  const giaMie = db.prenotazioni
    .filter((p) => p.eventoId === e.id && p.utenteId === utente.id && [...STATI_ATTIVI, 'lista_attesa'].includes(p.stato))
    .reduce((t, p) => t + p.quantita, 0);
  if (quantita < 1 || giaMie + quantita > BIGLIETTI.maxPerUtente)
    throw new HttpErr(409, BIGLIETTI.maxPerUtente === 1
      ? 'Hai già una prenotazione per questo evento.'
      : `Puoi prenotare al massimo ${BIGLIETTI.maxPerUtente} biglietti per evento.`, { codice: 'LIMITE_BIGLIETTI' });
  const disponibili = e.capienza - occupati(e.id);
  if (disponibili < quantita) throw new HttpErr(409, 'Posti esauriti.', { codice: 'POSTI_ESAURITI' });

  let posti = [];
  if (e.tipo === 'concerto') {
    posti = Array.isArray(body.posti) ? body.posti : [];
    const validi = codiciPostiValidi(e);
    const presi = new Set(conDisponibilita(e).postiOccupati);
    if (posti.length !== quantita || posti.some((p) => !validi.has(p)))
      throw new HttpErr(422, 'Seleziona un posto valido.');
    if (posti.some((p) => presi.has(p)))
      throw new HttpErr(409, 'Il posto scelto è appena stato occupato. Scegline un altro.', { codice: 'POSTO_OCCUPATO' });
  }

  const p = {
    id: nuovoId(db.prenotazioni),
    eventoId: e.id,
    utenteId: utente.id,
    stato: e.tipo === 'workshop' ? 'in_attesa' : 'confermata',
    statoPagamento: e.prezzo > 0 ? 'da_pagare' : 'non_richiesto',
    quantita,
    posti,
    creataIl: ora(),
  };
  db.prenotazioni.push(p);
  notifica(
    utente.id,
    e.tipo === 'workshop'
      ? `Richiesta di iscrizione a "${e.titolo}" inviata: in attesa di approvazione.`
      : `Prenotazione confermata per "${e.titolo}"${posti.length ? ` (posto ${posti.join(', ')})` : ''}.`,
  );
  return [201, { id: p.id }];
});

rotta('post', '/api/eventi/:id/lista-attesa', ({ utente, params, body }) => {
  richiedi(utente, AZIONI.LISTA_ATTESA_ENTRA);
  const e = trovaEvento(params.id);
  if (e.stato !== 'attivo') throw new HttpErr(409, 'L\'evento è stato annullato.', { codice: 'EVENTO_ANNULLATO' });
  const quantita = Number(body.quantita) || 1;
  if (e.capienza - occupati(e.id) >= quantita)
    throw new HttpErr(409, 'Ci sono ancora posti disponibili: puoi prenotare direttamente.', { codice: 'POSTI_DISPONIBILI' });
  if (db.prenotazioni.some((p) => p.eventoId === e.id && p.utenteId === utente.id && [...STATI_ATTIVI, 'lista_attesa'].includes(p.stato)))
    throw new HttpErr(409, 'Sei già in lista d\'attesa o prenotato per questo evento.', { codice: 'GIA_IN_LISTA' });
  const p = {
    id: nuovoId(db.prenotazioni),
    eventoId: e.id,
    utenteId: utente.id,
    stato: 'lista_attesa',
    statoPagamento: 'non_richiesto',
    quantita,
    posti: [],
    creataIl: ora(),
  };
  db.prenotazioni.push(p);
  notifica(utente.id, `Sei in lista d'attesa per "${e.titolo}".`);
  return [201, { id: p.id }];
});

function posizioneListaAttesa(p) {
  if (p.stato !== 'lista_attesa') return undefined;
  return db.prenotazioni
    .filter((x) => x.eventoId === p.eventoId && x.stato === 'lista_attesa')
    .sort((a, b) => a.creataIl.localeCompare(b.creataIl))
    .findIndex((x) => x.id === p.id) + 1;
}

rotta('get', '/api/prenotazioni/mie', ({ utente }) => {
  richiedi(utente, AZIONI.PRENOTAZIONI_MIE);
  const lista = db.prenotazioni
    .filter((p) => p.utenteId === utente.id)
    .map(({ utenteId, ...p }) => {
      const e = db.eventi.find((x) => x.id === p.eventoId);
      return { ...p, posizioneListaAttesa: posizioneListaAttesa({ ...p, utenteId }), evento: e ? conDisponibilita(e) : null };
    })
    .sort((a, b) => b.creataIl.localeCompare(a.creataIl));
  return [200, lista];
});

rotta('get', '/api/prenotazioni/da-approvare', ({ utente }) => {
  richiedi(utente, AZIONI.ISCRIZIONE_APPROVA);
  const lista = db.prenotazioni
    .filter((p) => p.stato === 'in_attesa')
    .map(({ utenteId, ...p }) => ({
      ...p,
      utente: datiUtente(utenteId),
      evento: db.eventi.find((x) => x.id === p.eventoId),
    }))
    .sort((a, b) => a.creataIl.localeCompare(b.creataIl));
  return [200, lista];
});

rotta('get', '/api/eventi/:id/prenotazioni', ({ utente, params }) => {
  richiedi(utente, AZIONI.PRENOTATI_VEDI);
  const e = trovaEvento(params.id);
  const lista = db.prenotazioni
    .filter((p) => p.eventoId === e.id)
    .map(({ utenteId, ...p }) => ({ ...p, utente: datiUtente(utenteId), posizioneListaAttesa: posizioneListaAttesa({ ...p, utenteId }) }))
    .sort((a, b) => a.creataIl.localeCompare(b.creataIl));
  return [200, lista];
});

const ETICHETTE_STATO = {
  confermata: 'Confermata', in_attesa: 'In attesa', approvata: 'Approvata', lista_attesa: 'Lista d\'attesa', annullata: 'Annullata',
};
const ETICHETTE_PAG = { non_richiesto: 'Non richiesto', da_pagare: 'Da pagare', pagato: 'Pagato' };

rotta('get', '/api/eventi/:id/prenotazioni/export', ({ utente, params }) => {
  richiedi(utente, AZIONI.PRENOTATI_ESPORTA_CSV);
  const e = trovaEvento(params.id);
  const righe = [['ID prenotazione', 'Nome', 'Email', 'Stato', 'Pagamento', 'Quantità', 'Posti', 'Data prenotazione']];
  db.prenotazioni
    .filter((p) => p.eventoId === e.id)
    .forEach((p) => {
      const u = datiUtente(p.utenteId) || {};
      righe.push([p.id, u.nome, u.email, ETICHETTE_STATO[p.stato], ETICHETTE_PAG[p.statoPagamento], p.quantita, p.posti.join(' '), new Date(p.creataIl).toLocaleString('it-IT')]);
    });
  return [200, new Blob([csv(righe)], { type: 'text/csv;charset=utf-8' })];
});

rotta('delete', '/api/prenotazioni/:id', ({ utente, params }) => {
  richiedi(utente, AZIONI.PRENOTAZIONE_ANNULLA_PROPRIA);
  const p = trovaPrenotazione(params.id);
  // Protezione dati: un utente non può nemmeno sapere se esiste la prenotazione di un altro
  if (p.utenteId !== utente.id) throw new HttpErr(404, 'Prenotazione non trovata.');
  if (p.stato === 'annullata') throw new HttpErr(409, 'La prenotazione è già annullata.');
  const e = trovaEvento(p.eventoId);
  if (new Date(e.dataOra) < new Date()) throw new HttpErr(409, 'Non puoi annullare la prenotazione di un evento già passato.');
  p.stato = 'annullata';
  notifica(utente.id, `Prenotazione per "${e.titolo}" annullata.`);
  return [204, null];
});

rotta('patch', '/api/prenotazioni/:id/approva', ({ utente, params }) => {
  richiedi(utente, AZIONI.ISCRIZIONE_APPROVA);
  const p = trovaPrenotazione(params.id);
  if (p.stato !== 'in_attesa') throw new HttpErr(409, 'Solo le iscrizioni "in attesa" possono essere approvate.');
  p.stato = 'approvata';
  const e = trovaEvento(p.eventoId);
  notifica(p.utenteId, `La tua iscrizione a "${e.titolo}" è stata approvata.`);
  const { utenteId, ...resto } = p;
  return [200, { ...resto, utente: datiUtente(utenteId) }];
});

rotta('patch', '/api/prenotazioni/:id/pagamento', ({ utente, params, body }) => {
  richiedi(utente, AZIONI.PAGAMENTO_SEGNA);
  const p = trovaPrenotazione(params.id);
  if (body.statoPagamento !== 'pagato') throw new HttpErr(422, 'Stato di pagamento non valido.');
  if (p.statoPagamento !== 'da_pagare') throw new HttpErr(409, 'Questa prenotazione non ha un pagamento in sospeso.');
  p.statoPagamento = 'pagato';
  const e = trovaEvento(p.eventoId);
  notifica(p.utenteId, `Pagamento ricevuto per "${e.titolo}". Grazie!`);
  const { utenteId, ...resto } = p;
  return [200, { ...resto, utente: datiUtente(utenteId) }];
});

// Collaboratori (solo admin)
function validaCollaboratore(body, idEscluso) {
  const errori = {};
  if (!body.nome?.trim()) errori.nome = 'Il nome è obbligatorio.';
  if (!EMAIL_RE.test(body.email || '')) errori.email = 'Email non valida.';
  if (Object.keys(errori).length) throw new HttpErr(422, 'Controlla i campi evidenziati.', { errori });
  if (db.utenti.some((u) => u.id !== idEscluso && u.email.toLowerCase() === body.email.toLowerCase()))
    throw new HttpErr(409, 'Esiste già un utente con questa email.', { codice: 'EMAIL_ESISTENTE', errori: { email: 'Email già in uso.' } });
}

rotta('get', '/api/collaboratori', ({ utente }) => {
  richiedi(utente, AZIONI.TEAM_GESTISCI);
  return [200, db.utenti.filter((u) => u.ruolo === 'collaboratore').map(pubblico)];
});

rotta('post', '/api/collaboratori', ({ utente, body }) => {
  richiedi(utente, AZIONI.TEAM_GESTISCI);
  validaCollaboratore(body);
  const passwordTemporanea = Math.random().toString(36).slice(2, 10) + 'A1';
  const u = { id: nuovoId(db.utenti), nome: body.nome.trim(), email: body.email.trim(), password: passwordTemporanea, ruolo: 'collaboratore' };
  db.utenti.push(u);
  return [201, { collaboratore: pubblico(u), passwordTemporanea }];
});

rotta('put', '/api/collaboratori/:id', ({ utente, params, body }) => {
  richiedi(utente, AZIONI.TEAM_GESTISCI);
  const u = db.utenti.find((x) => x.id === Number(params.id) && x.ruolo === 'collaboratore');
  if (!u) throw new HttpErr(404, 'Collaboratore non trovato.');
  validaCollaboratore(body, u.id);
  u.nome = body.nome.trim();
  u.email = body.email.trim();
  return [200, pubblico(u)];
});

rotta('delete', '/api/collaboratori/:id', ({ utente, params }) => {
  richiedi(utente, AZIONI.TEAM_GESTISCI);
  const u = db.utenti.find((x) => x.id === Number(params.id) && x.ruolo === 'collaboratore');
  if (!u) throw new HttpErr(404, 'Collaboratore non trovato.');
  db.utenti = db.utenti.filter((x) => x.id !== u.id);
  return [204, null];
});

// Notifiche
rotta('get', '/api/notifiche', ({ utente }) => {
  richiedi(utente, AZIONI.NOTIFICHE_VEDI);
  return [200, db.notifiche.filter((n) => n.utenteId === utente.id).sort((a, b) => b.creataIl.localeCompare(a.creataIl))];
});

rotta('patch', '/api/notifiche/lette', ({ utente }) => {
  richiedi(utente, AZIONI.NOTIFICHE_VEDI);
  db.notifiche.forEach((n) => {
    if (n.utenteId === utente.id) n.letta = true;
  });
  return [200, { ok: true }];
});

rotta('patch', '/api/notifiche/:id/letta', ({ utente, params }) => {
  richiedi(utente, AZIONI.NOTIFICHE_VEDI);
  const n = db.notifiche.find((x) => x.id === Number(params.id) && x.utenteId === utente.id);
  if (!n) throw new HttpErr(404, 'Notifica non trovata.');
  n.letta = true;
  return [200, n];
});

// ---------- Adapter ----------
export async function mockAdapter(config) {
  await new Promise((r) => setTimeout(r, LATENZA_MS));
  const metodo = (config.method || 'get').toLowerCase();
  const [percorso, qs] = (config.url || '').split('?');
  const query = { ...Object.fromEntries(new URLSearchParams(qs || '')), ...(config.params || {}) };
  let body = {};
  if (typeof config.data === 'string' && config.data) {
    try {
      body = JSON.parse(config.data);
    } catch {
      body = {};
    }
  }

  const risposta = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} });

  for (const r of rotte) {
    if (r.metodo !== metodo) continue;
    const m = percorso.match(r.regex);
    if (!m) continue;
    try {
      const utente = utenteDaToken(config.headers);
      const [status, data] = r.handler({ params: m.groups || {}, query, body, utente });
      salva();
      return risposta(status, data);
    } catch (err) {
      if (!(err instanceof HttpErr)) throw err;
      const res = risposta(err.status, { message: err.message, ...err.extra });
      throw new AxiosError(err.message, AxiosError.ERR_BAD_REQUEST, config, {}, res);
    }
  }
  const res = risposta(404, { message: `Endpoint mock non trovato: ${metodo.toUpperCase()} ${percorso}` });
  throw new AxiosError(res.data.message, AxiosError.ERR_BAD_REQUEST, config, {}, res);
}
