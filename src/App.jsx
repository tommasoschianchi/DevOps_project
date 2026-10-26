import { Navigate, Route, Routes } from 'react-router-dom';
import { AZIONI } from './config/permissions';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Registrazione from './pages/auth/Registrazione';
import Catalogo from './pages/Catalogo';
import DettaglioEvento from './pages/DettaglioEvento';
import Dashboard from './pages/Dashboard';
import Notifiche from './pages/Notifiche';
import ConfermaPrenotazione from './pages/partecipante/ConfermaPrenotazione';
import NuovoEvento from './pages/staff/NuovoEvento';
import ModificaEvento from './pages/staff/ModificaEvento';
import ListaPrenotati from './pages/staff/ListaPrenotati';
import IscrizioniDaApprovare from './pages/staff/IscrizioniDaApprovare';
import GestioneTeam from './pages/admin/GestioneTeam';
import NonTrovata from './pages/NonTrovata';

const protetta = (azione, elemento) => <ProtectedRoute azione={azione}>{elemento}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/eventi" replace />} />

        {/* Pubbliche */}
        <Route path="/login" element={<Login />} />
        <Route path="/registrazione" element={<Registrazione />} />
        <Route path="/eventi" element={<Catalogo />} />
        <Route path="/eventi/:id" element={<DettaglioEvento />} />

        {/* Autenticate (la dashboard cambia in base al ruolo) */}
        <Route path="/dashboard" element={protetta(null, <Dashboard />)} />
        <Route path="/notifiche" element={protetta(AZIONI.NOTIFICHE_VEDI, <Notifiche />)} />

        {/* Partecipante */}
        <Route path="/prenotazioni/:id/conferma" element={protetta(AZIONI.PRENOTAZIONI_MIE, <ConfermaPrenotazione />)} />

        {/* Collaboratore e Admin */}
        <Route path="/gestione/eventi/nuovo" element={protetta(AZIONI.EVENTO_CREA, <NuovoEvento />)} />
        <Route path="/gestione/eventi/:id/modifica" element={protetta(AZIONI.EVENTO_MODIFICA, <ModificaEvento />)} />
        <Route path="/gestione/eventi/:id/prenotati" element={protetta(AZIONI.PRENOTATI_VEDI, <ListaPrenotati />)} />
        <Route path="/gestione/approvazioni" element={protetta(AZIONI.ISCRIZIONE_APPROVA, <IscrizioniDaApprovare />)} />

        {/* Solo Admin */}
        <Route path="/gestione/team" element={protetta(AZIONI.TEAM_GESTISCI, <GestioneTeam />)} />

        <Route path="*" element={<NonTrovata />} />
      </Route>
    </Routes>
  );
}
