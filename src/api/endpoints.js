/**
 * Elenco COMPLETO degli endpoint usati dal frontend (contratto con il team backend).
 * Tutti i percorsi hanno prefisso /api; l'URL base si configura con VITE_API_URL.
 *
 * Legenda: [DOC] = definito nel documento di analisi, [PROPOSTA] = proposto dal frontend.
 *
 * Formato errori atteso: { message: string, codice?: string } con il codice HTTP appropriato.
 *  401 = non autenticato/token scaduto, 403 = azione non autorizzata,
 *  404 = non trovato, 409 = conflitto, 422 = validazione fallita.
 */
export const ENDPOINTS = {
  auth: {
    // [DOC] body { email, password } → 200 { token, ruolo } | 401
    login: '/api/auth/login',
    // [PROPOSTA] body { nome, email, password } → 201 { id } | 409 { codice: 'EMAIL_ESISTENTE' }
    registra: '/api/auth/register',
    // [DOC] → 200 { id, nome, email, ruolo }
    me: '/api/auth/me',
  },

  eventi: {
    // [PROPOSTA] GET ?q&tipo&categoria&luogo&dal&al → 200 Evento[] (pubblico)
    // POST body EventoInput → 201 Evento | 422 (es. data passata) | 403
    lista: '/api/eventi',
    // [PROPOSTA] GET → 200 Evento (pubblico; per i concerti include postiOccupati: string[])
    // [PROPOSTA] PUT body EventoInput → 200 Evento | 422 | 403
    // [DOC] DELETE → 204: annulla l'evento (stato "annullato"), email ai prenotati in asincrono
    // [PROPOSTA] DELETE ?definitivo=true → 204: elimina definitivamente (solo admin)
    dettaglio: (id) => `/api/eventi/${id}`,
    // [DOC] POST body { quantita, posti? } → 201 { id } | 409 { codice: 'POSTI_ESAURITI' | 'POSTO_OCCUPATO' | 'LIMITE_BIGLIETTI' }
    prenota: (id) => `/api/eventi/${id}/prenota`,
    // [PROPOSTA] POST body { quantita } → 201 { id } | 409 { codice: 'GIA_IN_LISTA' }
    listaAttesa: (id) => `/api/eventi/${id}/lista-attesa`,
    // [PROPOSTA] GET → 200 Prenotazione[] con dati partecipante (solo staff)
    prenotazioni: (id) => `/api/eventi/${id}/prenotazioni`,
    // [PROPOSTA] GET → 200 text/csv (solo staff)
    esportaCsv: (id) => `/api/eventi/${id}/prenotazioni/export`,
  },

  prenotazioni: {
    // [PROPOSTA] GET → 200 Prenotazione[] dell'utente loggato (con evento incluso)
    mie: '/api/prenotazioni/mie',
    // [PROPOSTA] GET → 200 Prenotazione[] in stato "in_attesa" di tutti gli eventi (solo staff)
    daApprovare: '/api/prenotazioni/da-approvare',
    // [PROPOSTA] DELETE → 204: il partecipante annulla la propria prenotazione
    dettaglio: (id) => `/api/prenotazioni/${id}`,
    // [PROPOSTA] PATCH → 200 Prenotazione (stato "approvata"; il backend notifica l'utente)
    approva: (id) => `/api/prenotazioni/${id}/approva`,
    // [PROPOSTA] PATCH body { statoPagamento: 'pagato' } → 200 Prenotazione
    pagamento: (id) => `/api/prenotazioni/${id}/pagamento`,
  },

  collaboratori: {
    // [PROPOSTA] GET → 200 Collaboratore[]; POST body { nome, email } → 201 { collaboratore, passwordTemporanea } | 409
    lista: '/api/collaboratori',
    // [PROPOSTA] PUT body { nome, email } → 200 | 409; DELETE → 204
    dettaglio: (id) => `/api/collaboratori/${id}`,
  },

  notifiche: {
    // [PROPOSTA] GET → 200 Notifica[] dell'utente loggato
    lista: '/api/notifiche',
    // [PROPOSTA] PATCH → 200
    segnaLetta: (id) => `/api/notifiche/${id}/letta`,
    // [PROPOSTA] PATCH → 200
    segnaTutteLette: '/api/notifiche/lette',
  },
};

/*
 * Modelli dati attesi [PROPOSTA]
 *
 * Evento {
 *   id, titolo, descrizione, categoria, tipo: 'concerto'|'workshop'|'djset',
 *   luogo, dataOra (ISO 8601), capienza, prezzo (0 = gratuito), postiPerFila (solo concerto),
 *   postiDisponibili, stato: 'attivo'|'annullato', postiOccupati?: string[] (solo concerto)
 * }
 * Prenotazione {
 *   id, eventoId, evento?, utente?: { id, nome, email } (solo per lo staff),
 *   stato: 'confermata'|'in_attesa'|'approvata'|'lista_attesa'|'annullata',
 *   statoPagamento: 'non_richiesto'|'da_pagare'|'pagato',
 *   quantita, posti: string[], creataIl
 * }
 * Notifica { id, messaggio, letta, creataIl, link? }
 */
