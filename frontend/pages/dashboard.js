import { useEffect, useState } from 'react';
import axios from 'axios';
import Shell from '../components/Shell';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const statusMap = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completada',
    cancelled: 'Cancelada'
  };

  async function load() {
    const token = localStorage.getItem('token');
    if (!token) return (window.location.href = '/login');
    const r = await axios.get(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    setMe(r.data);
    const o = await axios.get(`${API}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
    setOrders(o.data);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="panel">
            <div className="title">Mi saldo</div>
            <p>Balance: <strong>S/ {me?.balance ?? 0}</strong></p>
            <p>Token de saldo: <span className="pill">{me?.token_saldo}</span></p>
            <p className="muted">Para recargar desde Telegram: /recargar {`{token} {monto}`}</p>
            <a className="btn secondary" href="/servicios/taxi">Crear orden</a>
          </div>
        </div>
        <div className="col">
          <div className="panel">
            <div className="title">Historial de órdenes</div>
            <div>
              {orders.length === 0 && <div className="muted">Sin órdenes</div>}
              {orders.map(o => (
                <div className="card" key={o.id} style={{ marginBottom: 10 }}>
                  <div><strong>{o.service_type}</strong> — S/ {o.final_price}</div>
                  <div className="muted">Estado: {statusMap[o.status] || o.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}