/**
 * UNICO punto di configurazione dei permessi: ruolo → azioni consentite.
 * Le incongruenze del documento di analisi sono risolte QUI; quando Mario
 * risponde basta modificare questo file (il backend deve applicare le stesse regole).
 */

export const RUOLI = {
  OSPITE: 'ospite', // utente non autenticato
  PARTECIPANTE: 'partecipante',
  COLLABORATORE: 'collaboratore',
  ADMIN: 'admin',
};

export const ETICHETTE_RUOLO = {
  [RUOLI.OSPITE]: 'Ospite',
  [RUOLI.PARTECIPANTE]: 'Partecipante',
  [RUOLI.COLLABORATORE]: 'Collaboratore',
  [RUOLI.ADMIN]: 'Organizzatore principale',
};

export const AZIONI = {
  CATALOGO_VEDI: 'catalogo:vedi',
  EVENTO_PRENOTA: 'evento:prenota',
  LISTA_ATTESA_ENTRA: 'listaAttesa:entra',
  PRENOTAZIONI_MIE: 'prenotazioni:mie',
  PRENOTAZIONE_ANNULLA_PROPRIA: 'prenotazione:annullaPropria',
  NOTIFICHE_VEDI: 'notifiche:vedi',

  GESTIONE_EVENTI_VEDI: 'gestioneEventi:vedi',
  EVENTO_CREA: 'evento:crea',
  EVENTO_MODIFICA: 'evento:modifica',
  PRENOTATI_VEDI: 'prenotati:vedi',
  PRENOTATI_ESPORTA_CSV: 'prenotati:esportaCsv',
  ISCRIZIONE_APPROVA: 'iscrizione:approva',
  PAGAMENTO_SEGNA: 'pagamento:segna',

  EVENTO_ANNULLA: 'evento:annulla',
  EVENTO_ELIMINA: 'evento:elimina',
  TEAM_GESTISCI: 'team:gestisci',
};

const { OSPITE, PARTECIPANTE, COLLABORATORE, ADMIN } = RUOLI;
const STAFF = [COLLABORATORE, ADMIN];

export const PERMESSI = {
  // Incongruenza: US-07 chiede il login, il diagramma UML no.
  // Scelta: catalogo PUBBLICO, prenotazione con login.
  [AZIONI.CATALOGO_VEDI]: [OSPITE, PARTECIPANTE, COLLABORATORE, ADMIN],
  [AZIONI.EVENTO_PRENOTA]: [PARTECIPANTE],
  [AZIONI.LISTA_ATTESA_ENTRA]: [PARTECIPANTE],
  [AZIONI.PRENOTAZIONI_MIE]: [PARTECIPANTE],
  [AZIONI.PRENOTAZIONE_ANNULLA_PROPRIA]: [PARTECIPANTE],
  [AZIONI.NOTIFICHE_VEDI]: [PARTECIPANTE, COLLABORATORE, ADMIN],

  [AZIONI.GESTIONE_EVENTI_VEDI]: STAFF,
  [AZIONI.EVENTO_CREA]: STAFF,
  [AZIONI.EVENTO_MODIFICA]: STAFF,
  [AZIONI.PRENOTATI_VEDI]: STAFF,
  // Incongruenza: US-11 assegna l'export all'utente, il diagramma UML al collaboratore.
  // Scelta: collaboratore e admin.
  [AZIONI.PRENOTATI_ESPORTA_CSV]: STAFF,
  [AZIONI.ISCRIZIONE_APPROVA]: STAFF,
  [AZIONI.PAGAMENTO_SEGNA]: STAFF,

  // Incongruenza: il diagramma UML dice solo Admin, una user story il collaboratore.
  // Scelta: SOLO Admin.
  [AZIONI.EVENTO_ANNULLA]: [ADMIN],
  // US-05: il collaboratore non può eliminare eventi.
  [AZIONI.EVENTO_ELIMINA]: [ADMIN],
  [AZIONI.TEAM_GESTISCI]: [ADMIN],
};

/** true se il ruolo (o l'ospite, se ruolo è vuoto) può eseguire l'azione. */
export function can(ruolo, azione) {
  const consentiti = PERMESSI[azione];
  if (!consentiti) return false;
  return consentiti.includes(ruolo || OSPITE);
}
