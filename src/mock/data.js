/**
 * Dati finti per sviluppare senza backend (VITE_USE_MOCK=true).
 * Le date sono relative a "oggi", così gli eventi demo non risultano mai passati.
 *
 * Utenti demo:
 *   Admin          mario@gestioneeventi.it   / admin123
 *   Collaboratore  giulia@gestioneeventi.it  / collab123
 *   Partecipante   luca@example.com          / utente123
 *   Partecipante   sara@example.com          / utente123
 */

function traGiorni(giorni, ora = 21, minuti = 0) {
  const d = new Date();
  d.setDate(d.getDate() + giorni);
  d.setHours(ora, minuti, 0, 0);
  return d.toISOString();
}

function fa(giorni) {
  const d = new Date();
  d.setDate(d.getDate() - giorni);
  return d.toISOString();
}

export function creaDatiIniziali() {
  const utenti = [
    { id: 1, nome: 'Mario Rossi', email: 'mario@gestioneeventi.it', password: 'admin123', ruolo: 'admin' },
    { id: 2, nome: 'Giulia Bianchi', email: 'giulia@gestioneeventi.it', password: 'collab123', ruolo: 'collaboratore' },
    { id: 3, nome: 'Paolo Verdi', email: 'paolo@gestioneeventi.it', password: 'collab123', ruolo: 'collaboratore' },
    { id: 4, nome: 'Luca Neri', email: 'luca@example.com', password: 'utente123', ruolo: 'partecipante' },
    { id: 5, nome: 'Sara Gallo', email: 'sara@example.com', password: 'utente123', ruolo: 'partecipante' },
    { id: 6, nome: 'Marco Conti', email: 'marco@example.com', password: 'utente123', ruolo: 'partecipante' },
    { id: 7, nome: 'Elena Ferri', email: 'elena@example.com', password: 'utente123', ruolo: 'partecipante' },
  ];

  const eventi = [
    {
      id: 1,
      titolo: 'Concerto d\'autunno – Orchestra da camera',
      descrizione: 'Una serata di musica classica con brani di Vivaldi e Mozart.',
      categoria: 'Musica',
      tipo: 'concerto',
      luogo: 'Teatro Comunale, Bologna',
      dataOra: traGiorni(10, 21),
      capienza: 40,
      postiPerFila: 8,
      prezzo: 25,
      stato: 'attivo',
    },
    {
      id: 2,
      titolo: 'Workshop di fotografia urbana',
      descrizione: 'Mezza giornata tra teoria e uscita pratica. Porta la tua fotocamera o lo smartphone.',
      categoria: 'Arte',
      tipo: 'workshop',
      luogo: 'Spazio Creativo, Milano',
      dataOra: traGiorni(14, 10),
      capienza: 12,
      prezzo: 0,
      stato: 'attivo',
    },
    {
      id: 3,
      titolo: 'Workshop: introduzione al DJing',
      descrizione: 'Impara le basi del mixaggio su console digitale.',
      categoria: 'Formazione',
      tipo: 'workshop',
      luogo: 'Sound Lab, Torino',
      dataOra: traGiorni(21, 15),
      capienza: 8,
      prezzo: 40,
      stato: 'attivo',
    },
    {
      id: 4,
      titolo: 'Friday Night DJ Set',
      descrizione: 'Musica house ed elettronica fino a tarda notte.',
      categoria: 'Musica',
      tipo: 'djset',
      luogo: 'Club Aurora, Milano',
      dataOra: traGiorni(5, 23),
      capienza: 150,
      prezzo: 15,
      stato: 'attivo',
    },
    {
      id: 5,
      titolo: 'Sunset DJ Set in terrazza',
      descrizione: 'DJ set al tramonto, posti limitatissimi.',
      categoria: 'Musica',
      tipo: 'djset',
      luogo: 'Terrazza Mare, Rimini',
      dataOra: traGiorni(7, 19),
      capienza: 3,
      prezzo: 0,
      stato: 'attivo',
    },
    {
      id: 6,
      titolo: 'Concerto jazz in piazza',
      descrizione: 'Annullato per maltempo previsto.',
      categoria: 'Musica',
      tipo: 'concerto',
      luogo: 'Piazza Maggiore, Bologna',
      dataOra: traGiorni(3, 21),
      capienza: 24,
      postiPerFila: 6,
      prezzo: 0,
      stato: 'annullato',
    },
  ];

  const prenotazioni = [
    { id: 1, eventoId: 1, utenteId: 4, stato: 'confermata', statoPagamento: 'da_pagare', quantita: 1, posti: ['A3'], creataIl: fa(2) },
    { id: 2, eventoId: 1, utenteId: 5, stato: 'confermata', statoPagamento: 'pagato', quantita: 1, posti: ['A4'], creataIl: fa(2) },
    { id: 3, eventoId: 1, utenteId: 6, stato: 'confermata', statoPagamento: 'da_pagare', quantita: 1, posti: ['C5'], creataIl: fa(1) },
    { id: 4, eventoId: 2, utenteId: 4, stato: 'in_attesa', statoPagamento: 'non_richiesto', quantita: 1, posti: [], creataIl: fa(1) },
    { id: 5, eventoId: 2, utenteId: 6, stato: 'approvata', statoPagamento: 'non_richiesto', quantita: 1, posti: [], creataIl: fa(3) },
    { id: 6, eventoId: 3, utenteId: 5, stato: 'in_attesa', statoPagamento: 'da_pagare', quantita: 1, posti: [], creataIl: fa(1) },
    { id: 7, eventoId: 4, utenteId: 5, stato: 'confermata', statoPagamento: 'da_pagare', quantita: 1, posti: [], creataIl: fa(4) },
    { id: 8, eventoId: 5, utenteId: 5, stato: 'confermata', statoPagamento: 'non_richiesto', quantita: 1, posti: [], creataIl: fa(2) },
    { id: 9, eventoId: 5, utenteId: 6, stato: 'confermata', statoPagamento: 'non_richiesto', quantita: 1, posti: [], creataIl: fa(2) },
    { id: 10, eventoId: 5, utenteId: 7, stato: 'confermata', statoPagamento: 'non_richiesto', quantita: 1, posti: [], creataIl: fa(2) },
    { id: 11, eventoId: 6, utenteId: 4, stato: 'annullata', statoPagamento: 'non_richiesto', quantita: 1, posti: ['B2'], creataIl: fa(6) },
  ];

  const notifiche = [
    { id: 1, utenteId: 4, messaggio: 'L\'evento "Concerto jazz in piazza" è stato annullato.', letta: false, creataIl: fa(1), link: '/dashboard' },
    { id: 2, utenteId: 4, messaggio: 'Prenotazione confermata per "Concerto d\'autunno – Orchestra da camera" (posto A3).', letta: true, creataIl: fa(2), link: '/dashboard' },
    { id: 3, utenteId: 6, messaggio: 'La tua iscrizione a "Workshop di fotografia urbana" è stata approvata.', letta: false, creataIl: fa(2), link: '/dashboard' },
  ];

  return { utenti, eventi, prenotazioni, notifiche };
}
