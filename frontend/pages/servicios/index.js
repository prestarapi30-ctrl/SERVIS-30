import Shell from '../../components/Shell';

export default function ServiciosPanel() {
  return (
    <Shell>
      {/* Hero del panel con mensaje e insignias */}
      <div className="panel" style={{ marginBottom: 16, padding: 16 }}>
        <div className="title gradient">Órdenes al instante, sin complicaciones</div>
        <div className="muted" style={{ marginTop: 6 }}>
          gestiona tus servicios facil, rapido y seguro.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <span className="badge glow">🧭 Navegación simple</span>
          <span className="badge glow">🚀 Procesos optimizados</span>
        </div>
      </div>

      {/* El listado de servicios se muestra en la barra lateral del Shell */}
      <div className="panel" style={{ padding: 16 }}>
        <div className="muted">Selecciona un servicio en la barra lateral para comenzar.</div>
      </div>
    </Shell>
  );
}