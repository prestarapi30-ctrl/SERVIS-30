import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const r = await axios.post(`${API}/api/auth/register`, { name, email, password, phone });
      alert('Cuenta creada. Ahora puedes iniciar sesión.');
      window.location.href = '/login';
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  }

  return (
    <Layout>
      <div className="panel" style={{ maxWidth: 460, margin: '0 auto' }}>
        <div className="title">Registro</div>
      <form onSubmit={onSubmit}>
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="label" style={{ marginTop: 10 }}>Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="label" style={{ marginTop: 10 }}>Teléfono</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de contacto" />
          <label className="label" style={{ marginTop: 10 }}>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div style={{ marginTop: 14 }}>
            <button className="btn" type="submit">Crear cuenta</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}