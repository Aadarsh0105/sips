import { DownloadIcon, GraduationCapIcon, PrinterIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { printElement } from '../../lib/export';
import { formatDate } from '../../lib/utils';
import { useData } from '../../contexts/DataContext';
import type { StudentRecord } from '../../features/students/studentsSlice';

export function NoDuesCertificateModal({ student, open, onClose }: {
  student: StudentRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!student) return null;
  const { settings } = useData();
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="No Dues Certificate"
      subtitle={`${student.name} · ${student.studentId}`}
      footer={(
        <>
          <Button variant="outline" onClick={() => printElement('no-dues-certificate', 'No Dues Certificate')}>
            <DownloadIcon className="h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={() => printElement('no-dues-certificate', 'No Dues Certificate')}>
            <PrinterIcon className="h-4 w-4" /> Print Certificate
          </Button>
        </>
      )}
    >
      <div id="no-dues-certificate" className="mx-auto max-w-2xl border-2 border-slate-200 bg-white p-8 text-slate-900 print:border-slate-400" style={{ colorScheme: 'light' }}>
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            {settings.logo ? <img src={settings.logo} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-600 text-white"><GraduationCapIcon className="h-8 w-8" /></div>}
            <div><h1 className="font-display text-md font-extrabold">{settings.name}</h1>{settings.address ? <p className="text-xs text-slate-500">{settings.address}</p> : null}</div>
          </div>
          <p className="font-display text-md font-bold tracking-wide text-brand-700">NO DUES</p>
        </div>
        <div className="text-center">
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Official Certificate</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold">No Dues Certificate</h2>
        <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-brand-600" />
        <p className="mt-8 text-left text-base leading-7">
          This is to certify that <strong>{student.name}</strong>, Student ID <strong>{student.studentId}</strong>,
          of Class <strong>{student.className}-{student.section}</strong>, has no outstanding fees as of <strong>{formatDate(new Date().toISOString())}</strong>.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 border-y border-slate-200 py-4 text-left text-sm">
          <div><p className="text-slate-500">Admission No</p><p className="mt-1 font-semibold">{student.admissionNo || '—'}</p></div>
          <div><p className="text-slate-500">Father's Name</p><p className="mt-1 font-semibold">{student.fatherName || '—'}</p></div>
          <div><p className="text-slate-500">Class & Section</p><p className="mt-1 font-semibold">{student.className}-{student.section}</p></div>
          <div><p className="text-slate-500">Outstanding Due</p><p className="mt-1 font-semibold text-emerald-600">₹0</p></div>
        </div>
        <p className="mt-10 text-xs text-slate-500">{settings.invoiceFooter || 'This certificate is digitally generated and does not require a signature.'}</p>
        </div>
      </div>
    </Modal>
  );
}
