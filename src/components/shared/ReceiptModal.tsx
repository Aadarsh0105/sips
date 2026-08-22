import { DownloadIcon, PrinterIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Receipt } from './Receipt';
import { printElement } from '../../lib/export';
import { useData } from '../../contexts/DataContext';
import type { Payment, Student } from '../../lib/types';
import type { StudentRecord } from '../../features/students/studentsSlice';

export function ReceiptModal({
  payment,
  onClose,
  student: studentOverride,



}: {payment: Payment | null;onClose: () => void;student?: Student | StudentRecord | null;}) {
  const { getStudent, settings } = useData();
  if (!payment) return null;
  const student = studentOverride
    ? toReceiptStudent(studentOverride)
    : getStudent(payment.studentId);
  if (!student) return null;

  return (
    <Modal
      open={!!payment}
      onClose={onClose}
      size="lg"
      title="Fee Receipt"
      subtitle={`Receipt ${payment.receiptNumber} · Invoice ${payment.invoiceNumber}`}
      footer={
      <>
          <Button variant="outline" onClick={() => printElement('receipt-print', 'Fee Receipt')}>
            <DownloadIcon className="h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={() => printElement('receipt-print', 'Fee Receipt')}>
            <PrinterIcon className="h-4 w-4" /> Print Receipt
          </Button>
        </>
      }>
      
      <Receipt payment={payment} student={student} settings={settings} />
    </Modal>);

}

function toReceiptStudent(student: Student | StudentRecord): Student {
  if (!('_id' in student)) return student;
  return {
    id: student.studentId,
    admissionNumber: student.admissionNo ?? '',
    name: student.name,
    fatherName: student.fatherName ?? '',
    motherName: student.motherName ?? '',
    className: student.className ?? '',
    section: student.section ?? '',
    rollNumber: '',
    gender: (student.gender || 'OTHER') as Student['gender'],
    dob: student.dob ?? '',
    mobile: student.mobile ?? '',
    parentMobile: '',
    address: student.address ?? '',
    email: student.email ?? '',
    admissionDate: student.admissionDate ?? '',
    monthlyFee: student.monthlyFee ?? 0,
    openingDue: student.openingDue ?? 0,
    session: '',
    totalFee: student.totalFee ?? 0,
    discount: 0,
    fine: 0,
    dueDate: '',
    createdAt: student.createdAt ?? '',
  };
}
