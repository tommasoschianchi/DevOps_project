# GestioneEventi – Frontend

Frontend React della piattaforma di Mario per gestire prenotazioni, pagamenti e comunicazioni degli eventi
(concerti, workshop, DJ set).

Funziona **subito con dati mock** (`VITE_USE_MOCK=true`). Per collegarlo al backend Express reale si cambiano solo le
variabili d'ambiente: componenti e servizi restano identici, perché il mock è un *adapter Axios* che risponde agli
stessi endpoint con gli stessi codici HTTP.

**Stack:** React 18 + Vite 5, Tailwind CSS 3, Axios (istanza unica con interceptor JWT ed errori), React Router 6.
Il deploy usa un Dockerfile (build Node → Nginx) e Docker Compose.

---

## 1. Struttura delle cartelle

```
DevOps_project/
├── docker-compose.yml            # frontend (+ backend/db commentati, da attivare)
└── frontend/
    ├── Dockerfile                # build multi-stage: node → nginx
    ├── nginx.conf                # fallback SPA
    ├── .env.example
    ├── index.html
    ├── package.json  vite.config.js  tailwind.config.js  postcss.config.js
    └── src/
        ├── main.jsx              # provider: Router → Toast → Auth → Notifiche
        ├── App.jsx               # rotte pubbliche e protette per ruolo
        ├── index.css             # classi Tailwind riusabili (btn, input, card…)
        ├── config/
        │   ├── permissions.js    # ★ UNICO file ruolo → azioni consentite
        │   ├── regole.js         # ★ regole aperte con Mario (TODO-MARIO), categorie, polling
        │   └── env.js            # VITE_API_URL, VITE_USE_MOCK
        ├── api/
        │   ├── endpoints.js      # ★ UNICO elenco endpoint (contratto con il backend)
        │   └── client.js         # istanza Axios + interceptor (Bearer, 401 → logout, messaggi errore)
        ├── services/index.js     # layer servizi usato da tutti i componenti
        ├── mock/
        │   ├── data.js           # dati finti: 3 ruoli, eventi dei 3 tipi, prenotazioni, notifiche
        │   └── mockAdapter.js    # backend simulato (stessi endpoint, codici HTTP e controlli di ruolo)
        ├── context/              # AuthContext, ToastContext, NotificheContext
        ├── hooks/useApi.js       # stati caricamento / errore / dati + ricarica
        ├── utils/format.js       # date, prezzi, etichette stati, download file
        ├── components/
        │   ├── Layout.jsx  ProtectedRoute.jsx  StatoAsync.jsx  ConfirmModal.jsx  Badge.jsx
        │   ├── eventi/           # EventCard, FiltriEventi, EventoForm
        │   └── prenotazione/     # PannelloPrenotazione, MappaPosti, IndicatoreCapienza, InfoPagamento
        └── pages/
            ├── Catalogo.jsx  DettaglioEvento.jsx  Dashboard.jsx  Notifiche.jsx  NonTrovata.jsx
            ├── auth/             # Login, Registrazione
            ├── partecipante/     # MiePrenotazioni, ConfermaPrenotazione
            ├── staff/            # DashboardEventi, NuovoEvento, ModificaEvento, ListaPrenotati, IscrizioniDaApprovare
            └── admin/            # GestioneTeam
```

## 2. Installazione e avvio

Requisiti: Node.js 18 o superiore.

```bash
cd frontend
cp .env.example .env      # di default: VITE_USE_MOCK=true
npm install
npm run dev               # http://localhost:5173
```

Build di produzione: `npm run build` (output in `dist/`), anteprima con `npm run preview`.

### Account demo (solo mock)

| Ruolo | Email | Password |
|---|---|---|
| Admin (Mario) | mario@gestioneeventi.it | admin123 |
| Collaboratore | giulia@gestioneeventi.it | collab123 |
| Partecipante | luca@example.com | utente123 |
| Partecipante | sara@example.com | utente123 |

I dati mock restano salvati nel `localStorage` del browser. Per ripartire da zero usa **"Ripristina dati demo"** nella
barra gialla in alto.

Eventi demo: un concerto con mappa posti, due workshop (uno gratuito e uno a pagamento) con iscrizioni in attesa, un DJ
set capiente, un DJ set **già pieno** (per provare la lista d'attesa) e un concerto annullato.

## 3. Variabili d'ambiente

| Variabile | Default | Descrizione |
|---|---|---|
| `VITE_API_URL` | *(vuoto = stessa origine)* | URL base del backend, **senza** `/api` finale (es. `https://api.gestioneeventi.it`). Tutti gli endpoint hanno già il prefisso `/api`. |
| `VITE_USE_MOCK` | `false` | `true` = backend simulato nel browser; `false` = API reali. |

Le variabili `VITE_*` vengono incluse nel bundle **al momento della build**: se cambiano, l'immagine va ricostruita.

## 4. Avvio con Docker

```bash
# dalla root del progetto
docker compose up --build                    # http://localhost:8080 (mock attivo di default)

# contro il backend reale
VITE_USE_MOCK=false VITE_API_URL=https://api.esempio.it docker compose up --build
```

Solo il frontend:

```bash
cd frontend
docker build -t gestione-eventi-fe --build-arg VITE_API_URL=https://api.esempio.it --build-arg VITE_USE_MOCK=false .
docker run -p 8080:80 gestione-eventi-fe
```

Su **Render / Railway / Fly.io** si usa lo stesso Dockerfile, con `VITE_API_URL` e `VITE_USE_MOCK` impostati come
*build args*. Il backend dovrà abilitare il CORS per il dominio del frontend.

## 5. Collegamento al backend reale

1. Il team backend implementa gli endpoint elencati in `src/api/endpoints.js`, che contiene anche formati, codici di
   risposta e modelli dati.
2. Le regole di autorizzazione lato server devono essere le stesse di `src/config/permissions.js`. Il frontend nasconde
   o disabilita le azioni, ma la protezione vera la fa il backend con il middleware JWT.
3. Si imposta `VITE_USE_MOCK=false` e `VITE_API_URL=<url backend>`.

Il file `src/mock/mockAdapter.js` funziona anche come **specifica eseguibile**: per ogni endpoint mostra validazioni,
codici di errore (`codice`) e controlli di ruolo attesi.

---

## 6. Scelte prese sulle incongruenze del documento

Tutte le scelte sui permessi stanno in **`src/config/permissions.js`**: per cambiarle quando Mario risponde basta modificare quel file.

| Incongruenza | Scelta adottata | Dove si cambia |
|---|---|---|
| Residui di un altro progetto (Cittadino/Operator, tickets, services, mappa servizi) | Ignorati. I ruoli sono solo Partecipante, Collaboratore e Admin | — |
| Chi annulla un evento (UML: Admin; user story: Collaboratore) | **Solo Admin** | `PERMESSI[EVENTO_ANNULLA]` |
| Visibilità del catalogo (US-07: con login; UML: senza) | **Catalogo pubblico, prenotazione con login** | `PERMESSI[CATALOGO_VEDI]` |
| Export CSV (US-11: utente; UML: collaboratore) | **Collaboratore e Admin** | `PERMESSI[PRENOTATI_ESPORTA_CSV]` |
| Prefisso `/api` presente solo negli endpoint di autenticazione | `/api` su tutti gli endpoint, con URL base configurabile | `api/endpoints.js` |

## 7. Domande aperte con Mario (default scelti, marcati `// TODO-MARIO`)

Tutti i default sono in **`src/config/regole.js`**.

| Domanda | Default | Come cambiarlo |
|---|---|---|
| DJ set "fino a capienza": basta un contatore? | Contatore "posti rimasti / capienza" con barra di riempimento (`IndicatoreCapienza.jsx`) | `DJSET` |
| Link PayPal automatico o gestito a mano? | **A mano**: l'app mostra lo stato "da pagare" con il testo "riceverai le istruzioni", e il collaboratore segna "pagato" | `PAYPAL.linkAutomatico = true` + `paypalMeBase` → compare il pulsante "Paga con PayPal" |
| Più biglietti per lo stesso evento o biglietti nominativi? | **Nominativi: 1 per utente per evento** | `BIGLIETTI.maxPerUtente`: con un valore > 1 compaiono il selettore della quantità e la selezione di più posti sulla mappa (il backend deve applicare lo stesso limite) |

## 8. Aggiunte non presenti nel documento — [PROPOSTA]

- **[PROPOSTA] Endpoint**: tutti tranne `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/eventi/{id}/prenota` e
  `DELETE /api/eventi/{id}`. Sono marcati uno per uno in `api/endpoints.js`.
- **[PROPOSTA] Eliminazione definitiva** con `DELETE /api/eventi/{id}?definitivo=true`, distinta dall'annullamento
  (`DELETE` senza parametri = "annullato", come nel documento).
- **[PROPOSTA] Codici di errore applicativi** nel corpo delle risposte 409 (`POSTI_ESAURITI`, `POSTO_OCCUPATO`,
  `LIMITE_BIGLIETTI`, `GIA_IN_LISTA`, `EMAIL_ESISTENTE`…), per distinguere i casi con lo stesso codice HTTP.
  Validazioni fallite → `422` con `{ errori: { campo: messaggio } }`.
- **[PROPOSTA] Categorie**: Musica, Formazione, Arte, Tecnologia, Benessere, Altro (`regole.js`).
- **[PROPOSTA] Campo "posti per fila"** sui concerti, che serve a disegnare la mappa. File A, B, C…; i posti sono codici
  tipo `A5`.
- **[PROPOSTA] Modifica evento**: vale lo stesso blocco sulla data passata della creazione. Il tipo non si può cambiare
  se ci sono prenotazioni, la capienza non può scendere sotto i posti già prenotati e un evento annullato non si può
  modificare.
- **[PROPOSTA] Capienza dei workshop**: anche le iscrizioni "in attesa" occupano un posto fino all'approvazione.
- **[PROPOSTA] Lista d'attesa**: si mostrano lo stato e la posizione (n. X). Lo scorrimento della lista quando si libera
  un posto è compito del backend: il documento non lo definisce.
- **[PROPOSTA] Annullamento prenotazione**: non è possibile dopo l'inizio dell'evento. Se la prenotazione era già pagata,
  la modale ricorda di contattare l'organizzatore per il rimborso.
- **[PROPOSTA] Password** di almeno 8 caratteri e campo "conferma password" nella registrazione.
- **[PROPOSTA] Password temporanea del collaboratore**: viene generata dal backend e mostrata una sola volta all'admin,
  con il pulsante "copia".
- **[PROPOSTA] Dopo il login**, se l'utente arrivava da una pagina (per esempio "Accedi per prenotare" sul dettaglio
  evento), torna lì. Altrimenti va su `/dashboard`.
- **[PROPOSTA] Il catalogo pubblico** mostra solo gli eventi attivi e futuri. Lo staff vede tutti gli eventi (in
  programma, passati, annullati) nella propria dashboard.
- **[PROPOSTA] Notifiche**: anche lo staff ha l'area notifiche. Il contatore delle non lette si aggiorna dopo ogni
  azione e ogni 30 s (polling). Per marcare le notifiche come lette ci sono `PATCH /api/notifiche/{id}/letta` e
  `PATCH /api/notifiche/lette`.
- **[PROPOSTA] Il CSV** usa il separatore `;` e il BOM UTF-8, così si apre correttamente in Excel italiano.
- **[PROPOSTA] Il JWT** viene salvato in `localStorage`. In alternativa il backend può usare un cookie httpOnly:
  basterebbe modificare `api/client.js`.
- **[PROPOSTA] Modalità demo**: barra "dati simulati" con il pulsante di ripristino, visibile solo quando
  `VITE_USE_MOCK=true`.

## 9. Requisiti trasversali

- **Dati sempre aggiornati**: dopo ogni azione (prenotazione, annullamento, approvazione, pagamento, gestione team) la
  lista o la disponibilità coinvolta viene ricaricata senza ricaricare la pagina (`useApi().ricarica`). Se una
  prenotazione fallisce con un 409, la mappa dei posti e la disponibilità si aggiornano subito.
- **Notifiche**: area notifiche in-app (`/notifiche`, con badge nel menu) e toast di conferma o errore per ogni azione.
  Le email partono dal backend.
- **Protezione dei dati**: le pagine con dati personali (prenotati, iscrizioni, team) sono raggiungibili solo con i
  permessi giusti, sia nel router sia nel mock-backend. Il dettaglio evento pubblico espone solo i codici dei posti
  occupati, mai chi li occupa. Un partecipante che prova ad annullare la prenotazione di un altro riceve un 404.
- **Errori HTTP**: con 401 (o token scaduto) si fa logout e redirect al login con un messaggio; 403 → "Azione non
  autorizzata."; errore di rete → messaggio dedicato. Ogni chiamata gestisce caricamento, errore (con "Riprova") e
  lista vuota tramite `StatoAsync`.
- **Accessibilità**: tutti i campi hanno una label, gli errori sono collegati con `aria-describedby`, c'è il link "Vai al
  contenuto", focus visibile ovunque, modale con focus intrappolato ed Esc, mappa posti navigabile da tastiera con
  `aria-pressed` e `aria-label`, toast in `aria-live`, contrasti AA e target touch da almeno 44 px.
- **Responsive**: layout mobile-first, menu a scomparsa su smartphone, tabelle con scroll orizzontale.

---

## 10. Tracciabilità: user story / caso d'uso → implementazione

| ID | Funzionalità | Ruolo | File / componenti |
|---|---|---|---|
| US-01 | Creare evento, validazione, blocco della data passata, conferma, evento in lista | Admin, Collab. | `pages/staff/NuovoEvento.jsx`, `components/eventi/EventoForm.jsx` (`validaEvento`), `pages/staff/DashboardEventi.jsx` |
| US-02 | Registrare un collaboratore (password temporanea, errore se l'email esiste) | Admin | `pages/admin/GestioneTeam.jsx` (`aggiungi`) |
| US-03 | Login, errore con credenziali sbagliate, redirect alla dashboard del ruolo | Tutti | `pages/auth/Login.jsx`, `context/AuthContext.jsx`, `api/client.js`, `pages/Dashboard.jsx` |
| US-04 | Registrazione partecipante (errore se l'email esiste) | Partecipante | `pages/auth/Registrazione.jsx` |
| US-05 | Il collaboratore non può eliminare eventi (pulsante disabilitato, 403 → "azione non autorizzata") | Admin | `config/permissions.js` (`EVENTO_ELIMINA`), `pages/staff/DashboardEventi.jsx`, `api/client.js` (`messaggioErrore`) |
| US-06 | Approvare le iscrizioni "in attesa" | Collab. | `pages/staff/IscrizioniDaApprovare.jsx`, `pages/staff/ListaPrenotati.jsx` |
| US-07 | Catalogo con filtri (data, tipo/categoria, luogo), ricerca, dettaglio con "Prenota" | Partecipante | `pages/Catalogo.jsx`, `components/eventi/FiltriEventi.jsx`, `components/eventi/EventCard.jsx`, `pages/DettaglioEvento.jsx` |
| US-08 | Gestione collaboratori: aggiungi, modifica, rimuovi, lista aggiornata, conferma | Admin | `pages/admin/GestioneTeam.jsx` |
| US-09 | Lista d'attesa se l'evento è pieno, con stato | Partecipante | `components/prenotazione/PannelloPrenotazione.jsx` (`entraInLista`), `components/Badge.jsx` (`BadgeStato`), `pages/partecipante/MiePrenotazioni.jsx` |
| US-10 | Annullare la propria prenotazione con conferma, disponibilità aggiornata | Partecipante | `pages/partecipante/MiePrenotazioni.jsx`, `components/ConfirmModal.jsx` |
| US-11 / UC-13 | Export CSV dei prenotati | Collab., Admin | `pages/staff/ListaPrenotati.jsx` (`esporta`), `services/index.js` (`esportaCsv`) |
| UC-06 | Annullare un evento (modale, prenotati avvisati, stato "annullato") | Admin | `pages/staff/DashboardEventi.jsx` (`conferma`), `services/index.js` (`annulla`) |
| UC-08 | Segnare il pagamento come ricevuto | Collab., Admin | `pages/staff/ListaPrenotati.jsx`, `components/prenotazione/InfoPagamento.jsx` |
| Flusso 1 | Login → JWT → `/dashboard`; 401 → logout | Tutti | `context/AuthContext.jsx`, `api/client.js` |
| Flusso 2 | Prenota → 201 → conferma; 409 → errore + lista d'attesa | Partecipante | `components/prenotazione/PannelloPrenotazione.jsx`, `pages/partecipante/ConfermaPrenotazione.jsx` |
| Flusso 3 | `DELETE /eventi/{id}` → 204 → "annullato" | Admin | `pages/staff/DashboardEventi.jsx` |
| Tipi evento | Concerto (mappa posti), Workshop (in attesa → approvata), DJ set (capienza) | — | `components/prenotazione/MappaPosti.jsx`, `PannelloPrenotazione.jsx`, `IndicatoreCapienza.jsx` |
| Entry fee | Stato pagamento "da pagare" / "pagato" | — | `components/prenotazione/InfoPagamento.jsx`, `components/Badge.jsx` (`BadgePagamento`) |
| Rotte per ruolo | Redirect con messaggio se l'URL non è autorizzato | Tutti | `components/ProtectedRoute.jsx`, `App.jsx` |
| Notifiche | Area notifiche in-app e conferme visive | Tutti (loggati) | `pages/Notifiche.jsx`, `context/NotificheContext.jsx`, `context/ToastContext.jsx` |

## 11. Mappa delle pagine e dei permessi

| Rotta | Pagina | Ospite | Partecipante | Collaboratore | Admin |
|---|---|:-:|:-:|:-:|:-:|
| `/eventi`, `/eventi/:id` | Catalogo, Dettaglio | ✔ | ✔ (prenota) | ✔ | ✔ |
| `/login`, `/registrazione` | Accesso | ✔ | – | – | – |
| `/dashboard` | Le mie prenotazioni / Gestione eventi | – | ✔ | ✔ | ✔ |
| `/notifiche` | Notifiche | – | ✔ | ✔ | ✔ |
| `/prenotazioni/:id/conferma` | Conferma prenotazione | – | ✔ | – | – |
| `/gestione/eventi/nuovo`, `/:id/modifica` | Crea / Modifica evento | – | – | ✔ | ✔ |
| `/gestione/eventi/:id/prenotati` | Lista prenotati, approva, pagato, CSV | – | – | ✔ | ✔ |
| `/gestione/approvazioni` | Iscrizioni da approvare | – | – | ✔ | ✔ |
| `/gestione/team` | Gestione team | – | – | – | ✔ |
| Azione "Annulla evento" / "Elimina evento" | (Dashboard eventi) | – | – | disabilitata | ✔ |
