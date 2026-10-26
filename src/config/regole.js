/**
 * Regole di business ancora aperte con Mario.
 * Ogni valore è un default ragionevole, cambiabile da qui.
 */

// TODO-MARIO: DJ set "fino a capienza": basta un contatore dei posti o serve altro?
// Default: solo contatore "posti rimasti / capienza" con barra di riempimento.
export const DJSET = {
  modalita: 'contatore',
  mostraBarra: true,
};

// TODO-MARIO: il link PayPal va inviato in automatico o gestito a mano?
// Default: gestito a mano. L'app mostra "da pagare" e il collaboratore segna "pagato".
// Con linkAutomatico = true e paypalMeBase valorizzato, l'app mostra un pulsante
// "Paga con PayPal" che apre https://www.paypal.me/<utente>/<importo>EUR.
export const PAYPAL = {
  linkAutomatico: false,
  paypalMeBase: '', // es. 'https://www.paypal.me/marioeventi'
};

// TODO-MARIO: un utente può prenotare più biglietti per lo stesso evento o sono nominativi?
// Default: biglietti nominativi, 1 per utente per evento.
// Alzando il valore il frontend mostra il selettore quantità (e più posti sulla mappa).
export const BIGLIETTI = {
  maxPerUtente: 1,
};

// [PROPOSTA] intervallo di aggiornamento automatico del contatore notifiche (ms)
export const POLLING_NOTIFICHE_MS = 30000;

// [PROPOSTA] categorie disponibili (il documento le cita come proposta, senza elenco)
export const CATEGORIE = ['Musica', 'Formazione', 'Arte', 'Tecnologia', 'Benessere', 'Altro'];

export const TIPI_EVENTO = {
  CONCERTO: 'concerto',
  WORKSHOP: 'workshop',
  DJSET: 'djset',
};

export const ETICHETTE_TIPO = {
  concerto: 'Concerto',
  workshop: 'Workshop',
  djset: 'DJ set',
};
