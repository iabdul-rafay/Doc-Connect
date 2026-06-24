import { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState } from '../../components/ui';
import PrescriptionCard from '../../components/PrescriptionCard';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

export default function DoctorPrescriptions() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/prescriptions/doctor')
      .then(({ data }) => setItems(data.prescriptions))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <div>
      <PageHeader title="Prescriptions" subtitle="Every prescription you've written." />

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions yet"
          message="Write a prescription from a confirmed appointment to see it here."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((p) => (
            <PrescriptionCard key={p._id} prescription={p} perspective="doctor" />
          ))}
        </div>
      )}
    </div>
  );
}
