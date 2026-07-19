



import React from 'react';
import { DownloadIcon, PrinterIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Receipt } from './Receipt';
import { printElement } from '../../lib/export';
import { useData } from '../../contexts/DataContext';
import type { Payment } from '../../lib/types';

export function ReceiptModal({
  payment,
  onClose



}: {payment: Payment | null;onClose: () => void;}) {
  const { getStudent, settings } = useData();
  if (!payment) return null;
  const student = getStudent(payment.studentId);
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