import Shell from '../../components/Shell';
import ServiceForm from '../../components/ServiceForm';

export default function CambioNotas() {
  return (
    <Shell>
      <ServiceForm serviceKey="cambio-notas" title="Cambio de notas" fixedPrice={350} />
    </Shell>
  );
}