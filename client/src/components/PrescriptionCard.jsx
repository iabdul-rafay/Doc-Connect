import { Pill, CalendarCheck, ClipboardList } from 'lucide-react';
import { Avatar } from './ui';
import { formatDate } from '../lib/format';

/**
 * Renders a single prescription. `perspective` controls whose name is shown:
 * a patient sees the doctor; a doctor sees the patient.
 */
export default function PrescriptionCard({ prescription: p, perspective = 'patient', action }) {
  const person = perspective === 'patient' ? p.doctor : p.patient;
  const personLabel = perspective === 'patient' ? 'Prescribed by' : 'For patient';

  return (
    <article className="card overflow-hidden transition-shadow hover:shadow-[var(--shadow-glow)]">
      <div className="flex items-center gap-3 border-b border-line bg-mist px-5 py-4">
        <Avatar name={person?.name} src={person?.avatar} size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-faint">{personLabel}</p>
          <p className="truncate font-semibold text-ink">{person?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-sm text-ink-soft sm:flex">
            <CalendarCheck size={15} /> {formatDate(p.createdAt)}
          </span>
          {action}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {p.diagnosis && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ClipboardList size={15} className="text-brand-600" /> Diagnosis
            </p>
            <p className="text-sm text-ink-soft">{p.diagnosis}</p>
          </div>
        )}

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Pill size={15} className="text-brand-600" /> Medicines
          </p>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="px-3 py-2 font-medium">Medicine</th>
                  <th className="px-3 py-2 font-medium">Dosage</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Frequency</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.medicines.map((m, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2 font-medium text-ink">
                      {m.name}
                      {m.instructions && <span className="block text-xs font-normal text-faint">{m.instructions}</span>}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{m.dosage || '—'}</td>
                    <td className="hidden px-3 py-2 text-ink-soft sm:table-cell">{m.frequency || '—'}</td>
                    <td className="hidden px-3 py-2 text-ink-soft sm:table-cell">{m.duration || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {p.advice && (
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Advice</p>
            <p className="text-sm text-ink-soft">{p.advice}</p>
          </div>
        )}
        {p.followUpDate && (
          <p className="text-sm text-brand-700">
            <span className="font-medium">Follow-up: </span>{formatDate(p.followUpDate)}
          </p>
        )}
      </div>
    </article>
  );
}
