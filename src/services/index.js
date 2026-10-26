/**
 * Layer di servizi: l'unico punto in cui i componenti parlano con le API.
 * Mock e backend reale usano lo stesso codice: cambia solo l'adapter Axios (VITE_USE_MOCK).
 */
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const dati = (res) => res.data;

export const authService = {
  login: (email, password) => api.post(ENDPOINTS.auth.login, { email, password }).then(dati),
  registra: (nome, email, password) =>
    api.post(ENDPOINTS.auth.registra, { nome, email, password }).then(dati),
  me: () => api.get(ENDPOINTS.auth.me).then(dati),
};

export const eventiService = {
  lista: (filtri = {}) => {
    const params = Object.fromEntries(Object.entries(filtri).filter(([, v]) => v !== '' && v != null));
    return api.get(ENDPOINTS.eventi.lista, { params }).then(dati);
  },
  dettaglio: (id) => api.get(ENDPOINTS.eventi.dettaglio(id)).then(dati),
  crea: (evento) => api.post(ENDPOINTS.eventi.lista, evento).then(dati),
  modifica: (id, evento) => api.put(ENDPOINTS.eventi.dettaglio(id), evento).then(dati),
  // Flusso del documento: DELETE /eventi/{id} → 204 = evento annullato
  annulla: (id) => api.delete(ENDPOINTS.eventi.dettaglio(id)).then((res) => res.status),
  elimina: (id) =>
    api.delete(ENDPOINTS.eventi.dettaglio(id), { params: { definitivo: true } }).then((res) => res.status),
  prenota: (id, body) => api.post(ENDPOINTS.eventi.prenota(id), body).then(dati),
  entraListaAttesa: (id, body) => api.post(ENDPOINTS.eventi.listaAttesa(id), body).then(dati),
  prenotati: (id) => api.get(ENDPOINTS.eventi.prenotazioni(id)).then(dati),
  esportaCsv: (id) =>
    api.get(ENDPOINTS.eventi.esportaCsv(id), { responseType: 'blob' }).then(dati),
};

export const prenotazioniService = {
  mie: () => api.get(ENDPOINTS.prenotazioni.mie).then(dati),
  daApprovare: () => api.get(ENDPOINTS.prenotazioni.daApprovare).then(dati),
  annulla: (id) => api.delete(ENDPOINTS.prenotazioni.dettaglio(id)).then((res) => res.status),
  approva: (id) => api.patch(ENDPOINTS.prenotazioni.approva(id)).then(dati),
  segnaPagato: (id) =>
    api.patch(ENDPOINTS.prenotazioni.pagamento(id), { statoPagamento: 'pagato' }).then(dati),
};

export const collaboratoriService = {
  lista: () => api.get(ENDPOINTS.collaboratori.lista).then(dati),
  crea: (nome, email) => api.post(ENDPOINTS.collaboratori.lista, { nome, email }).then(dati),
  modifica: (id, dati_) => api.put(ENDPOINTS.collaboratori.dettaglio(id), dati_).then(dati),
  rimuovi: (id) => api.delete(ENDPOINTS.collaboratori.dettaglio(id)).then((res) => res.status),
};

export const notificheService = {
  lista: () => api.get(ENDPOINTS.notifiche.lista).then(dati),
  segnaLetta: (id) => api.patch(ENDPOINTS.notifiche.segnaLetta(id)).then(dati),
  segnaTutteLette: () => api.patch(ENDPOINTS.notifiche.segnaTutteLette).then(dati),
};
