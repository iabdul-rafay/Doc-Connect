import { useEffect, useState } from 'react';
import { Pill, Download } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState } from '../../components/ui';
import PrescriptionCard from '../../components/PrescriptionCard';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function DoctorPrescriptions() {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .get('/prescriptions/doctor')
      .then(({ data }) => setItems(data.prescriptions))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleDownload = async (p) => {
    setBusyId(p._id);
    try {
      const { downloadPrescriptionPdf } = await import('../../lib/prescriptionPdf');
      await downloadPrescriptionPdf({
        prescription: p,
        doctor: { name: user.name, ...(p.doctorMeta || {}) },
        patient: { name: p.patient?.name, phone: p.patient?.phone, city: p.patient?.city },
      });
    } catch (err) {
      toast.error('Could not generate the PDF. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Prescriptions" subtitle="Every prescription you've written. Download any as a PDF." />

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState icon={Pill} title="No prescriptions yet" message="Write a prescription from a confirmed appointment to see it here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((p, i) => (
            <div key={p._id} className="stagger" style={{ '--i': i }}>
              <PrescriptionCard
                prescription={p}
                perspective="doctor"
                action={
                  <button onClick={() => handleDownload(p)} disabled={busyId === p._id}
                    className="btn-ghost px-3 py-1.5 text-xs">
                    <Download size={14} /> {busyId === p._id ? 'Preparing…' : 'PDF'}
                  </button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
