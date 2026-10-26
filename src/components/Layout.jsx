import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifiche } from '../context/NotificheContext';
import { AZIONI, ETICHETTE_RUOLO } from '../config/permissions';
import { USE_MOCK } from '../config/env';
import { resetMock } from '../mock/mockAdapter';

const classiLink = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
    isActive ? 'bg-brand-800 text-white' : 'text-brand-50 hover:bg-brand-700'
  }`;

export default function Layout() {
  const { utente, ruolo, can, logout } = useAuth();
  const { nonLette } = useNotifiche();
  const [menuAperto, setMenuAperto] = useState(false);
  const location = useLocation();

  // Voci di menu filtrate per permesso (config/permissions.js)
  const voci = [
    { to: '/eventi', testo: 'Catalogo eventi', azione: AZIONI.CATALOGO_VEDI },
    { to: '/dashboard', testo: 'Le mie prenotazioni', azione: AZIONI.PRENOTAZIONI_MIE },
    { to: '/dashboard', testo: 'Gestione eventi', azione: AZIONI.GESTIONE_EVENTI_VEDI },
    { to: '/gestione/approvazioni', testo: 'Iscrizioni da approvare', azione: AZIONI.ISCRIZIONE_APPROVA },
    { to: '/gestione/team', testo: 'Team', azione: AZIONI.TEAM_GESTISCI },
  ].filter((v) => can(v.azione));

  const chiudiMenu = () => setMenuAperto(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-brand-700"
      >
        Vai al contenuto
      </a>
      {USE_MOCK && (
        <div className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
          Modalità demo con dati simulati.{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              resetMock();
              window.location.reload();
            }}
          >
            Ripristina dati demo
          </button>
        </div>
      )}
      <header className="bg-brand-600 text-white shadow">
        <nav aria-label="Navigazione principale" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/eventi" className="rounded text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={chiudiMenu}>
            GestioneEventi
          </Link>
          <button
            type="button"
            className="rounded-lg border border-brand-100/40 px-3 py-2 text-sm md:hidden"
            aria-expanded={menuAperto}
            aria-controls="menu-principale"
            onClick={() => setMenuAperto((v) => !v)}
          >
            Menu
          </button>
          <div
            id="menu-principale"
            className={`${menuAperto ? 'flex' : 'hidden'} w-full flex-col gap-1 md:flex md:w-auto md:flex-row md:items-center`}
          >
            {voci.map((v) => (
              <NavLink key={v.testo} to={v.to} className={classiLink} onClick={chiudiMenu} end>
                {v.testo}
              </NavLink>
            ))}
            {utente ? (
              <>
                {can(AZIONI.NOTIFICHE_VEDI) && (
                  <NavLink to="/notifiche" className={classiLink} onClick={chiudiMenu}>
                    Notifiche
                    {nonLette > 0 && (
                      <span className="ml-1.5 rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-brand-700">
                        {nonLette}
                        <span className="sr-only"> non lette</span>
                      </span>
                    )}
                  </NavLink>
                )}
                <span className="px-3 py-2 text-xs text-brand-50 md:border-l md:border-brand-100/40">
                  {utente.nome} · {ETICHETTE_RUOLO[ruolo]}
                </span>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-50 hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  onClick={() => {
                    chiudiMenu();
                    logout('Sei uscito correttamente.');
                  }}
                >
                  Esci
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" state={{ da: location.pathname }} className={classiLink} onClick={chiudiMenu}>
                  Accedi
                </NavLink>
                <NavLink to="/registrazione" className={classiLink} onClick={chiudiMenu}>
                  Registrati
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <main id="contenuto" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-600">
        GestioneEventi · Progetto DevOps
      </footer>
    </div>
  );
}
