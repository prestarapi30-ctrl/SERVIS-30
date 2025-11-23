import ServicesGallery from '../components/ServicesGallery';
import Layout from '../components/Layout';

export default function ServiciosPage() {
  return (
    <Layout>
      <div className="section">
        <div className="title" style={{ marginBottom: 10 }}>Servicios disponibles</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          Explora el catálogo de servicios. Para generar órdenes necesitas iniciar sesión.
        </div>
        <ServicesGallery />
      </div>
    </Layout>
  );
}