import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="title">Bienvenido a SERVIS-30</div>
        <p className="muted">Servicios confiables con descuento automático del 30%. Excepto cambio de notas (precio fijo S/ 350).</p>
        <div style={{ marginTop: 12 }}>
          <a className="btn" href="/login">Ingresar</a>
          <span style={{ marginLeft: 8 }}></span>
          <a className="btn secondary" href="/register">Crear cuenta</a>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="panel">
            <div className="title">Servicios</div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <a className="card link" href="/servicios/taxi">Taxi</a>
              <a className="card link" href="/servicios/vuelos-bus">Vuelos/Bus</a>
              <a className="card link" href="/servicios/pago-universidad">Pago Universidad</a>
              <a className="card link" href="/servicios/cambio-notas">Cambio de notas</a>
              <a className="card link" href="/servicios/pago-luz">Pago Luz</a>
              <a className="card link" href="/servicios/pago-internet">Pago Internet</a>
              <a className="card link" href="/servicios/pago-movil">Pago Móvil</a>
            </div>
          </div>
        </div>
        
      </div>
    </Layout>
  );
}