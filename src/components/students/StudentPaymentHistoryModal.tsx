import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import type { Payment } from '../../lib/types';
import type { StudentRecord } from '../../features/students/studentsSlice';

type FeeHistoryItem = {
  _id: string;
  receiptNo: string;
  studentId: string;
  feeHead: string;
  amount: number;
  paymentType: string;
  feefeeDiscountType: string;
  lumpSumDiscountPercent: number;
  lumpSumDiscountAmount: number;
  paymentMode: string;
  paymentStatus: string;
  transactionId: string;
  remarks: string;
  collectedBy: { _id: string; name: string; role: string } | null;
  paymentDate: string;
};

export function StudentPaymentHistoryModal({
  student,
  open,
  onClose,
  onViewReceipt,
}: {
  student: StudentRecord | null;
  open: boolean;
  onClose: () => void;
  onViewReceipt?: (payment: Payment) => void;
}) {
  const [history, setHistory] = useState<FeeHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !student?.studentId) {
      setHistory([]);
      return;
    }

    let active = true;
    setLoading(true);
    void api
      .get(`${API.FEES}/history/${student.studentId}`)
      .then((response) => {
        if (!active) return;
        setHistory(response?.data?.data ?? []);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, student?.studentId]);

  if (!student) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Payment History"
      subtitle={`${student.name} · ${student.studentId}`}
      footer={null}
    >
      <div className="space-y-4">
        {loading ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
            Loading payment history...
          </p>
        ) : history.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Receipt</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Method</th>
                  {/* <th className="px-4 py-2.5 font-semibold">Type</th> */}
                  <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  {onViewReceipt ? <th className="px-4 py-2.5 text-right font-semibold">Action</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((payment) => {
                  const mappedPayment: Payment = {
                    id: payment._id,
                    receiptNumber: payment.receiptNo,
                    invoiceNumber: '',
                    studentId: payment.studentId,
                    amount: payment.amount,
                    method: (payment.paymentMode.toLowerCase() as Payment['method']),
                    transactionId: payment.transactionId || undefined,
                    status: payment.paymentStatus === 'SUCCESS' ? 'completed' : 'pending_verification',
                    collectedBy: payment.collectedBy?.name ?? '',
                    date: payment.paymentDate,
                    remainingAfter: 0,
                    note: payment.remarks || undefined,
                  };

                  return (
                    <tr key={payment._id}>
                      <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                        {payment.receiptNo}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {formatDate(payment.paymentDate)} · {formatTime(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-2.5 uppercase text-slate-500">{payment.paymentMode}</td>
                      {/* <td className="px-4 py-2.5 uppercase text-slate-500">{payment.paymentType}</td> */}
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        {payment.paymentStatus === 'SUCCESS' ? (
                          <Badge tone="green">Completed</Badge>
                        ) : (
                          <Badge tone="amber">Pending</Badge>
                        )}
                      </td>
                      {onViewReceipt ? (
                        <td className="px-4 py-2.5 text-right">
                          {payment.paymentStatus === 'SUCCESS' ? (
                            <Button size="sm" variant="ghost" onClick={() => onViewReceipt(mappedPayment)}>
                              Receipt
                            </Button>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
