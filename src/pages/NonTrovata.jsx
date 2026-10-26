import { Link } from 'react-router-dom';

export default function NonTrovata() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-2xl font-bold">Pagina non trovata</h1>
      <p className="mt-2 text-slate-700">L'indirizzo che hai aperto non esiste.</p>
      <Link to="/eventi" className="btn-primary mt-6">Vai al catalogo</Link>
    </div>
  );
}
