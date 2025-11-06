import Shell from '../../components/Shell';
import ServiceForm from '../../components/ServiceForm';

export default function Taxi() {
  return (
    <Shell>
      <ServiceForm serviceKey="taxi" title="Taxi" />
    </Shell>
  );
}