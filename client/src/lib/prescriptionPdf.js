import { jsPDF } from 'jspdf';
import logoFull from '../assets/logo-full.png';

// Brand colors (RGB)
const TEAL = [15, 118, 110];
const TEAL_LIGHT = [224, 247, 244];
const INK = [20, 48, 45];
const GRAY = [110, 130, 126];
const LINE = [210, 222, 219];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Generate and download a prescription PDF styled like a doctor's prescription.
 * @param {object} prescription  the prescription record (diagnosis, medicines, advice, followUpDate, createdAt)
 * @param {object} doctor        { name, specialization, qualifications, hospital }
 * @param {object} patient       { name, phone, city }
 */
export async function downloadPrescriptionPdf({ prescription, doctor, patient }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;
  let y = M;

  // ── Letterhead ───────────────────────────────────────────────────────────
  try {
    const logo = await loadImage(logoFull);
    const lh = 42;
    const lw = (logo.w / logo.h) * lh;
    doc.addImage(logo.dataUrl, 'PNG', M, y, lw, lh);
  } catch {
    doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...TEAL);
    doc.text('DocConnect', M, y + 26);
  }

  // Doctor block (right aligned)
  const rx = W - M;
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK);
  doc.text(doctor?.name || 'Doctor', rx, y + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...TEAL);
  if (doctor?.specialization) doc.text(doctor.specialization, rx, y + 27, { align: 'right' });
  doc.setFontSize(9).setTextColor(...GRAY);
  const sub = [doctor?.qualifications, doctor?.hospital].filter(Boolean).join('  ·  ');
  if (sub) doc.text(sub, rx, y + 40, { align: 'right' });

  y += 56;
  doc.setDrawColor(...TEAL).setLineWidth(2).line(M, y, W - M, y);
  y += 22;

  // ── Patient + date row ─────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK);
  doc.text('Patient', M, y);
  doc.setFont('helvetica', 'normal').setTextColor(...INK);
  doc.text(patient?.name || '—', M + 52, y);

  doc.setFont('helvetica', 'bold').setTextColor(...GRAY).setFontSize(10);
  doc.text('Date', rx - 120, y, { align: 'left' });
  doc.setFont('helvetica', 'normal').setTextColor(...INK).setFontSize(11);
  doc.text(fmtDate(prescription?.createdAt), rx, y, { align: 'right' });

  const meta2 = [patient?.phone, patient?.city].filter(Boolean).join('  ·  ');
  if (meta2) {
    y += 15;
    doc.setFontSize(9).setTextColor(...GRAY);
    doc.text(meta2, M + 52, y);
  }
  y += 26;

  // ── Rx + diagnosis ─────────────────────────────────────────────────────────
  doc.setFont('times', 'bold').setFontSize(30).setTextColor(...TEAL);
  doc.text('\u211E', M, y + 6); // ℞
  if (prescription?.diagnosis) {
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...GRAY);
    doc.text('DIAGNOSIS', M + 40, y - 6);
    doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...INK);
    const dx = doc.splitTextToSize(prescription.diagnosis, W - M - (M + 40));
    doc.text(dx, M + 40, y + 9);
    y += 9 + dx.length * 13;
  } else {
    y += 6;
  }
  y += 18;

  // ── Medicines table ────────────────────────────────────────────────────────
  const cols = [
    { key: 'idx', label: '#', w: 24 },
    { key: 'name', label: 'Medicine', w: 168 },
    { key: 'dosage', label: 'Dosage', w: 78 },
    { key: 'frequency', label: 'Frequency', w: 115 },
    { key: 'duration', label: 'Duration', w: 0 }, // fills remaining
  ];
  const tableW = W - 2 * M;
  cols[4].w = tableW - cols.reduce((s, c, i) => (i < 4 ? s + c.w : s), 0);

  // header
  const rowH = 22;
  doc.setFillColor(...TEAL).rect(M, y, tableW, rowH, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(255, 255, 255);
  let cx = M;
  cols.forEach((c) => {
    doc.text(c.label, cx + 7, y + 14);
    cx += c.w;
  });
  y += rowH;

  // rows
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK);
  (prescription?.medicines || []).forEach((m, i) => {
    const nameLines = doc.splitTextToSize(m.name || '—', cols[1].w - 14);
    const instr = m.instructions ? doc.splitTextToSize(m.instructions, cols[1].w - 14) : [];
    const cellLines = nameLines.length + (instr.length ? instr.length : 0);
    const rH = Math.max(rowH, 12 + cellLines * 11);

    if (i % 2 === 1) doc.setFillColor(...TEAL_LIGHT).rect(M, y, tableW, rH, 'F');

    cx = M;
    // idx
    doc.setTextColor(...GRAY).text(String(i + 1), cx + 7, y + 15);
    cx += cols[0].w;
    // name (+ instructions italic under)
    doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(10);
    doc.text(nameLines, cx + 7, y + 15);
    if (instr.length) {
      doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(...GRAY);
      doc.text(instr, cx + 7, y + 15 + nameLines.length * 11);
    }
    cx += cols[1].w;
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK);
    doc.text(m.dosage || '—', cx + 7, y + 15); cx += cols[2].w;
    doc.text(m.frequency || '—', cx + 7, y + 15); cx += cols[3].w;
    doc.text(m.duration || '—', cx + 7, y + 15);

    // row border
    doc.setDrawColor(...LINE).setLineWidth(0.5).line(M, y + rH, W - M, y + rH);
    y += rH;
  });

  y += 18;

  // ── Advice + follow-up ─────────────────────────────────────────────────────
  if (prescription?.advice) {
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...GRAY);
    doc.text('ADVICE', M, y);
    doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...INK);
    const ax = doc.splitTextToSize(prescription.advice, W - 2 * M);
    doc.text(ax, M, y + 15);
    y += 15 + ax.length * 13 + 6;
  }
  if (prescription?.followUpDate) {
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...TEAL);
    doc.text(`Follow-up: ${fmtDate(prescription.followUpDate)}`, M, y);
    y += 18;
  }

  // ── Signature ──────────────────────────────────────────────────────────────
  const sigY = Math.max(y + 40, H - 120);
  doc.setDrawColor(...INK).setLineWidth(0.6).line(W - M - 160, sigY, W - M, sigY);
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK);
  doc.text(doctor?.name || '', W - M, sigY + 14, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRAY);
  doc.text('Doctor signature', W - M, sigY + 26, { align: 'right' });

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc.setDrawColor(...LINE).setLineWidth(0.6).line(M, H - 48, W - M, H - 48);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...GRAY);
  doc.text('This prescription was generated digitally via DocConnect.', M, H - 34);
  doc.text('Not a substitute for an in-person medical evaluation.', M, H - 24);

  const safe = (patient?.name || 'patient').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`prescription-${safe}-${fmtDate(prescription?.createdAt).replace(/ /g, '-')}.pdf`);
}
