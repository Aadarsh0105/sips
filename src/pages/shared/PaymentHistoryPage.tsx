import { useEffect, useMemo, useState } from 'react';
import { DownloadIcon, EyeIcon, ReceiptIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Receipt } from '../../components/shared/Receipt';
import { useData } from '../../contexts/DataContext';
import { printElement } from '../../lib/export';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { exportCSV } from '../../lib/export';
import type { Payment, SchoolSettings, Student } from '../../lib/types';

type FeeHistoryItem = {
  feeBreakdown?: Record<string, number>;
  _id: string;
  receiptNo: string;
  student:
    | {
        _id: string;
        studentId: string;
        admissionNo: string;
        name: string;
        fatherName: string;
        className: string;
        section: string;
      }
    | string;
  studentId: string;
  feeHead: string;
  amount: number;
  paymentType: string;
  feeDiscountType: string;
  lumpSumDiscountPercent: number;
  lumpSumDiscountAmount: number;
  paymentMode: string;
  paymentStatus: string;
  transactionId: string;
  remarks: string;
  collectedBy: { _id: string; name: string; role: string } | null;
  paymentDate: string;
};

const PAGE_SIZE = 12;

function mapToPayment(item: FeeHistoryItem): Payment {
  return {
    id: item._id,
    receiptNumber: item.receiptNo,
    invoiceNumber: '',
    studentId: item.studentId,
    amount: item.amount,
    method: item.paymentMode.toLowerCase() as Payment['method'],
    transactionId: item.transactionId || undefined,
    status: item.paymentStatus === 'SUCCESS' ? 'completed' : 'pending_verification',
    collectedBy: item.collectedBy?.name ?? '',
    date: item.paymentDate,
    remainingAfter: 0,
    note: item.remarks || undefined,
    feeBreakdown: item.feeBreakdown,
  };
}

function mapStudent(item: FeeHistoryItem): Student {
  const student = typeof item.student === 'object' ? item.student : null;
  return {
    id: student?._id ?? item.studentId,
    admissionNumber: student?.admissionNo ?? '',
    name: student?.name ?? item.studentId,
    fatherName: student?.fatherName ?? '',
    motherName: '',
    className: student?.className ?? '',
    section: student?.section ?? '',
    rollNumber: '',
    gender: 'MALE',
    dob: '',
    mobile: '',
    parentMobile: '',
    address: '',
    email: '',
    admissionDate: '',
    monthlyFee: 0,
    openingDue: 0,
    session: '',
    totalFee: item.amount,
    discount: 0,
    fine: 0,
    dueDate: '',
    createdAt: item.paymentDate,
  };
}

export function PaymentHistoryPage() {
  const { settings } = useData();
  const [history, setHistory] = useState<FeeHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('all');
  const [page, setPage] = useState(1);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void api
      .get(API.FEES + '/history')
      .then((response) => {
        if (!active) return;
        setHistory(response?.data?.data ?? []);
      })
      .catch((error) => {
        if (!active) return;
        setHistory([]);
        toast.error(error?.response?.data?.message ?? 'Unable to load fee history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history
      .filter((p) => {
        const student = typeof p.student === 'object' ? p.student : null;
        const studentName = student?.name ?? '';
        const studentId = student?.studentId ?? p.studentId;
        const matchesQuery =
          !q ||
          p.receiptNo.toLowerCase().includes(q) ||
          studentId.toLowerCase().includes(q) ||
          p.transactionId.toLowerCase().includes(q) ||
          studentName.toLowerCase().includes(q) ||
          (p.collectedBy?.name ?? '').toLowerCase().includes(q);
        const matchesMethod = method === 'all' || p.paymentMode.toLowerCase() === method;
        return matchesQuery && matchesMethod;
      })
      .sort((a, b) => +new Date(b.paymentDate) - +new Date(a.paymentDate));
  }, [history, query, method]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    exportCSV(
      'payment-history',
      filtered.map((p) => {
        const student = typeof p.student === 'object' ? p.student : null;
        return {
          Receipt: p.receiptNo,
          Student: student?.name ?? p.studentId,
          Amount: p.amount,
          Date: formatDate(p.paymentDate),
          Time: formatTime(p.paymentDate),
          Method: p.paymentMode,
          CollectedBy: p.collectedBy?.name ?? '',
          Status: p.paymentStatus,
        };
      })
    );
    toast.success('Payment history exported.');
  };

  return (
    <div>
      <PageHeader
        title="Payment History"
        subtitle={`${history.length} total transactions`}
        inlineOnMobile
        action={
          <Button variant="outline" className="shrink-0 justify-center" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4" /> Export
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search receipt, student ID, txn ID, student…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="px-6 py-10 text-sm text-slate-500">Loading payment history...</p>
        ) : current.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="No transactions" description="Try adjusting your filters." />
        ) : (
          <div className="w-full overflow-x-auto pb-2">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Receipt</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Student</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Date &amp; Time</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Collected By</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {current.map((item) => {
                  const student = mapStudent(item);
                  const payment = mapToPayment(item);
                  return (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{item.receiptNo}</p>
                        <p className="text-xs text-slate-400">{item.feeHead} · {item.paymentType}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{student.name}</p>
                        <p className="text-xs text-slate-400">
                          {item.studentId}
                          {typeof item.student === 'object' && item.student.className
                            ? ` · Class ${item.student.className}-${item.student.section || '—'}`
                            : ''}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                        {formatDate(item.paymentDate)} · {formatTime(item.paymentDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {item.collectedBy?.name ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400">{item.collectedBy?.role ?? ''}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.paymentStatus === 'SUCCESS' ? <Badge tone="green">Completed</Badge> : <Badge tone="amber">Pending</Badge>}
                      </td>
                      <td className="py-3.5 text-right">
                        <HistoryActionMenu
                          onView={() => {
                            setReceipt(payment);
                            setReceiptStudent(student);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <Pagination page={page} pageCount={pageCount} total={filtered.length} onPage={setPage} />
        </div>
      </Card>

      <FeeReceiptModal
        payment={receipt}
        student={receiptStudent}
        settings={settings}
        onClose={() => {
          setReceipt(null);
          setReceiptStudent(null);
        }}
      />
    </div>
  );
}

function HistoryActionMenu({
  onView,
}: {
  onView: () => void;
}) {
  return (
    <button
      onClick={onView}
      className="flex w-full items-center justify-end gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <EyeIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" /> View
    </button>
  );
}

function FeeReceiptModal({
  payment,
  student,
  settings,
  onClose,
}: {
  payment: Payment | null;
  student: Student | null;
  settings: SchoolSettings;
  onClose: () => void;
}) {
  if (!payment || !student) return null;

  return (
    <Modal
      open={!!payment}
      onClose={onClose}
      size="lg"
      title="Fee Receipt"
      subtitle={`Receipt ${payment.receiptNumber} · Invoice ${payment.invoiceNumber || '—'}`}
      footer={
        <>
          <Button variant="outline" onClick={() => printElement('receipt-print', 'Fee Receipt')}>
            <DownloadIcon className="h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={() => printElement('receipt-print', 'Fee Receipt')}>
            <DownloadIcon className="h-4 w-4" /> Print Receipt
          </Button>
        </>
      }
    >
      <Receipt payment={payment} student={student} settings={settings} />
    </Modal>
  );
}
