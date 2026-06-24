import { useEffect, useState } from 'react';
import { Users, Mail, Phone, MapPin } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState, Avatar } from '../../components/ui';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

export default function DoctorPatients() {
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/doctors/me/patients')
      .then(({ data }) => setPatients(data.patients))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const shown = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader title="Patients" subtitle="Everyone who has booked an appointment with you." />

      {!loading && patients.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients by name"
          className="field mb-5 max-w-sm"
        />
      )}

      {loading ? (
        <PageLoader />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Users}
          title={patients.length === 0 ? 'No patients yet' : 'No matches'}
          message={patients.length === 0 ? 'Patients appear here once they book with you.' : 'Try a different name.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <div key={p._id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} src={p.avatar} size={48} />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{p.name}</h3>
                  {p.city && <p className="flex items-center gap-1 text-sm text-ink-soft"><MapPin size={13} />{p.city}</p>}
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-ink-soft">
                <p className="flex items-center gap-2 truncate"><Mail size={14} className="text-faint" />{p.email}</p>
                {p.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-faint" />{p.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
