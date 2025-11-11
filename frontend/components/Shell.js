import { useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Shell({ children }) {
  useEffect(() => {
    let timer = null;
    const RESET_MS = 10 * 60 * 1000; // 10 minutos
    function reset() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, RESET_MS);
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, reset));
    reset();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, []);

  return (
    <div>
      <nav className="nav">
        <div className="logo">
          <img src="/logo.svg" alt="SERVIS-30" width={28} height={28} />
          <strong style={{ fontSize: 18 }}>SERVIS-30</strong>
          <span className="pill">Panel</span>
        </div>
        <div>
          <a className="link" href="/" style={{ marginRight: 12 }}>Inicio</a>
          <a className="link" href="/dashboard" style={{ marginRight: 12 }}>Dashboard</a>
          <a className="link" href="/perfil" style={{ marginRight: 12 }}>Perfil</a>
          {!(typeof window !== 'undefined' && localStorage.getItem('token')) && (
            <a className="link" href="/admin" style={{ marginRight: 12 }}>Admin</a>
          )}
          <a className="btn" href="/servicios/taxi" style={{ marginRight: 12 }}>Nueva orden</a>
          {typeof window !== 'undefined' && localStorage.getItem('token') ? (
            <button className="btn secondary" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}>Cerrar sesión</button>
          ) : (
            <a className="btn" href="/login">Entrar</a>
          )}
        </div>
      </nav>
      <main className="container row">
        <Sidebar />
        <div className="col">
          {children}
        </div>
      </main>
      <footer className="container" style={{ marginTop: 24 }}>
        <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="title" style={{ fontSize: 18 }}>Contacto</div>
            <div className="muted">Soporte y asistencia del panel disponibles.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <a className="pill link" href="https://t.me/Servis30z" target="_blank" rel="noopener noreferrer">Telegram: @Servis30z</a>
            <a className="pill link" href="mailto:contactrecia24@gmail.com">Correo: contactrecia24@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}