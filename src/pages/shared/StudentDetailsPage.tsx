import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PaymentModal } from '../../components/shared/PaymentModal';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { StudentDetailModal } from '../../components/students/StudentDetailModal';
import { StudentPaymentHistoryModal } from '../../components/students/StudentPaymentHistoryModal';
import { StudentFormModal } from '../../components/shared/StudentFormModal';
import { CommonConfirmModal } from '../../components/ui/CommonConfirmModal';
import { CLASS_OPTIONS } from '../../lib/classes';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { deleteStudent, fetchStudents, type StudentRecord } from '../../features/students/studentsSlice';
import type { Payment } from '../../lib/types';

type LateFeeWaiverDeletePayload = {
  month: string;
  lateFee: number;
  lateFeePaid: number;
  waivedAmount: number;
  payableLateFee: number;
};

export function StudentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const canManage = location.pathname.startsWith('/admin/');
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [busAction, setBusAction] = useState<'start' | 'stop' | null>(null);
  const [busSaving, setBusSaving] = useState(false);
  const [stopPreview, setStopPreview] = useState<any | null>(null);
  const [startForm, setStartForm] = useState({ effectiveFrom: '', busFee: '', reason: '' });
  const [stopForm, setStopForm] = useState({ effectiveFrom: '', reason: '', refundMode: 'CASH', receivedBy: '', remarks: '' });
  const [lateFeeOpen, setLateFeeOpen] = useState(false);
  const [lateFeeSaving, setLateFeeSaving] = useState(false);
  const [lateFeeForm, setLateFeeForm] = useState({ month: '', waiverType: 'AMOUNT', waivedAmount: '', reason: '' });
  const [feeCalculation, setFeeCalculation] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteSaving, setPromoteSaving] = useState(false);
  const [promoteForm, setPromoteForm] = useState({ toClass: '', section: 'A', remarks: '' });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [waiverDeletePayload, setWaiverDeletePayload] = useState<LateFeeWaiverDeletePayload | null>(null);
  const [waiverDeleteAmount, setWaiverDeleteAmount] = useState('');

  const loadStudent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`${API.STUDENTS}/${id}`);
      const studentData = response?.data?.data ?? null;
      setStudent(studentData);
      if (studentData?.studentId) {
        const calculationResponse = await api.post(`${API.FEES}/calculate`, {
          studentId: studentData.studentId,
          feeHead: 'ALL',
        });
        setFeeCalculation(calculationResponse?.data?.data ?? null);
      } else {
        setFeeCalculation(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to load student details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadStudent();
  }, [loadStudent]);

  const previewBusStop = async () => {
    if (!student || !stopForm.effectiveFrom || !stopForm.reason.trim()) {
      toast.error('Effective date and reason are required.');
      return;
    }
    try {
      setBusSaving(true);
      const response = await api.post(`${API.STUDENTS}/${student.studentId}/bus-facility/stop-preview`, {
        effectiveFrom: stopForm.effectiveFrom,
        reason: stopForm.reason.trim(),
        refundMode: stopForm.refundMode,
      });
      setStopPreview(response?.data?.data ?? null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to calculate bus refund preview.');
    } finally {
      setBusSaving(false);
    }
  };

  const stopBusFacility = async () => {
    if (!student || !stopPreview) return;
    if (Number(stopPreview.refundAmount ?? 0) > 0 && stopForm.refundMode === 'CASH' && !stopForm.receivedBy.trim()) {
      toast.error('Received by is required for a cash refund.');
      return;
    }
    try {
      setBusSaving(true);
      await api.post(`${API.STUDENTS}/${student.studentId}/bus-facility/stop`, {
        effectiveFrom: stopForm.effectiveFrom,
        reason: stopForm.reason.trim(),
        refundMode: stopForm.refundMode,
        confirmCashRefund: stopForm.refundMode === 'CASH',
        receivedBy: stopForm.receivedBy.trim(),
        remarks: stopForm.remarks.trim(),
      });
      toast.success('Bus facility stopped successfully.');
      setBusAction(null);
      setStopPreview(null);
      await loadStudent();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to stop bus facility.');
    } finally {
      setBusSaving(false);
    }
  };

  const startBusFacility = async () => {
    if (!student || !startForm.effectiveFrom || !Number(startForm.busFee) || !startForm.reason.trim()) {
      toast.error('Effective date, bus fee, and reason are required.');
      return;
    }
    try {
      setBusSaving(true);
      await api.post(`${API.STUDENTS}/${student.studentId}/bus-facility/start`, {
        effectiveFrom: startForm.effectiveFrom,
        busFee: Number(startForm.busFee),
        reason: startForm.reason.trim(),
      });
      toast.success('Bus facility started successfully.');
      setBusAction(null);
      await loadStudent();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to start bus facility.');
    } finally {
      setBusSaving(false);
    }
  };

  const waiveLateFee = async () => {
    if (!student || !lateFeeForm.month || !lateFeeForm.reason.trim()) {
      toast.error('Month and reason are required.');
      return;
    }
    if (lateFeeForm.waiverType === 'AMOUNT' && (!Number(lateFeeForm.waivedAmount) || Number(lateFeeForm.waivedAmount) <= 0)) {
      toast.error('Enter a valid waived amount.');
      return;
    }
    try {
      setLateFeeSaving(true);
      await api.post(`${API.FEES}/late-fee/waive`, {
        studentId: student.studentId,
        month: lateFeeForm.month,
        waiverType: lateFeeForm.waiverType,
        ...(lateFeeForm.waiverType === 'AMOUNT' ? { waivedAmount: Number(lateFeeForm.waivedAmount) } : {}),
        reason: lateFeeForm.reason.trim(),
      });
      toast.success('Late fee waived successfully.');
      setLateFeeOpen(false);
      await loadStudent();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to waive late fee.');
    } finally {
      setLateFeeSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Student Profile</h1>
          <p className="text-sm text-slate-500">Complete student, fee, and promotion details</p>
        </div>
      </div>

      <Card className="p-3 sm:p-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-500">Loading student details...</p>
        ) : student ? (
          <StudentDetailModal
            student={student}
            open
            page
            onClose={() => navigate(-1)}
            onPay={() => setPaying(true)}
            onViewHistory={() => setHistoryOpen(true)}
            onWaiveLateFee={Number(feeCalculation?.lateFee ?? 0) > 0 ? () => {
              setLateFeeForm({ month: '', waiverType: 'AMOUNT', waivedAmount: '', reason: '' });
              setLateFeeOpen(true);
            } : undefined}
            onBusAction={() => {
              if ((student as any).hasBusFacility) {
                setStopForm({ effectiveFrom: '', reason: '', refundMode: 'CASH', receivedBy: '', remarks: '' });
                setStopPreview(null);
                setBusAction('stop');
              } else {
                setStartForm({ effectiveFrom: '', busFee: String((student as any).busFee ?? ''), reason: '' });
                setBusAction('start');
              }
            }}
            onEdit={canManage ? () => setEditOpen(true) : undefined}
            onPromote={canManage ? () => {
              setPromoteForm({ toClass: '', section: student.section || 'A', remarks: '' });
              setPromoteOpen(true);
            } : undefined}
            onDelete={canManage ? () => setDeleteOpen(true) : undefined}
            onDeleteLateFeeWaiver={canManage ? (waiver) => {
              const waivedAmount = Number(waiver.waivedAmount ?? waiver.amount ?? 0);
              setWaiverDeleteAmount(String(waivedAmount));
              setWaiverDeletePayload({
                month: waiver.month,
                lateFee: Number(waiver.lateFee ?? 0),
                lateFeePaid: Number(waiver.lateFeePaid ?? 0),
                waivedAmount,
                payableLateFee: Number(waiver.payableLateFee ?? 0),
              });
            } : undefined}
          />
        ) : (
          <p className="py-16 text-center text-sm text-slate-500">Student not found.</p>
        )}
      </Card>

      {student && feeCalculation ? (
        <Card className="mt-5 p-3 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Calculated Fee Details</h2>
              <p className="text-sm text-slate-500">Current accrued fees, payments, waivers, and outstanding balance</p>
            </div>
            <p className="font-display text-xl font-bold text-rose-600">Due {formatCurrency(feeCalculation.dueFee ?? 0)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <PreviewStat label="Calculated Total" value={formatCurrency(feeCalculation.totalFee ?? 0)} />
            <PreviewStat label="Paid Fee" value={formatCurrency(feeCalculation.paidFee ?? 0)} tone="text-emerald-600" />
            <PreviewStat label="Late Fee" value={formatCurrency(feeCalculation.lateFee ?? 0)} />
            <PreviewStat label="Late Fee Waived" value={formatCurrency(feeCalculation.lateFeeWaived ?? 0)} />
            <PreviewStat label="Late Fee Paid" value={formatCurrency(feeCalculation.lateFeePaid ?? 0)} tone="text-emerald-600" />
            <PreviewStat label="Payable Late Fee" value={formatCurrency(feeCalculation.payableLateFee ?? 0)} tone="text-rose-600" />
            <PreviewStat label="Accrued Months" value={String(feeCalculation.accruedMonths ?? 0)} />
            <PreviewStat label="Accrued Bus Months" value={String(feeCalculation.accruedBusMonths ?? 0)} />
            <PreviewStat label="Monthly Bus Fee" value={formatCurrency(feeCalculation.monthlyBusFee ?? 0)} />
            <PreviewStat label="Discount Type" value={feeCalculation.feeDiscountType || 'NONE'} />
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="grid min-w-[480px] grid-cols-4 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <span>Fee Head</span><span className="text-right">Total</span><span className="text-right">Paid</span><span className="text-right">Due</span>
            </div>
            {Object.keys(feeCalculation.feeBreakdown ?? {}).map((head) => (
              <div key={head} className="grid min-w-[480px] grid-cols-4 border-t border-slate-100 px-3 py-2.5 text-sm dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-200">{head.replace(/_/g, ' ')}</span>
                <span className="text-right text-slate-700 dark:text-slate-200">{formatCurrency(feeCalculation.feeBreakdown?.[head] ?? 0)}</span>
                <span className="text-right text-emerald-600">{formatCurrency(feeCalculation.paidBreakdown?.[head] ?? 0)}</span>
                <span className="text-right font-semibold text-rose-600">{formatCurrency(feeCalculation.dueBreakdown?.[head] ?? 0)}</span>
              </div>
            ))}
          </div>

          {feeCalculation.lateFeeDetails?.length ? (
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Late Fee Breakdown</h3>
                <p className="text-xs text-slate-500">Month-wise late fee, payment, waiver, and payable balance</p>
              </div>
              <div className={`grid ${canManage ? 'min-w-[720px] grid-cols-6' : 'min-w-[600px] grid-cols-5'} bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400`}>
                <span>Month</span>
                <span className="text-right">Late Fee</span>
                <span className="text-right">Paid</span>
                <span className="text-right">Waived</span>
                <span className="text-right">Payable</span>
                {canManage ? <span className="text-right">Action</span> : null}
              </div>
              {feeCalculation.lateFeeDetails.map((item: any) => {
                const savedWaiver = (Array.isArray((student as any).lateFeeWaivers) ? (student as any).lateFeeWaivers : [])
                  .find((waiver: any) => waiver.month === item.month);
                const waivedAmount = Number(item.waivedAmount ?? savedWaiver?.waivedAmount ?? savedWaiver?.amount ?? 0);
                return (
                  <div key={item.month} className={`grid ${canManage ? 'min-w-[720px] grid-cols-6' : 'min-w-[600px] grid-cols-5'} items-center border-t border-slate-100 px-3 py-2.5 text-sm dark:border-slate-800`}>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{item.month || '—'}</span>
                    <span className="text-right text-slate-700 dark:text-slate-200">{formatCurrency(item.lateFee ?? 0)}</span>
                    <span className="text-right text-emerald-600">{formatCurrency(item.lateFeePaid ?? 0)}</span>
                    <span className="text-right text-amber-600">{formatCurrency(waivedAmount)}</span>
                    <span className="text-right font-semibold text-rose-600">{formatCurrency(item.payableLateFee ?? 0)}</span>
                    {canManage ? (
                      <span className="flex justify-end">
                        {item.month ? (
                          <button
                            type="button"
                            onClick={() => {
                              setWaiverDeleteAmount(String(waivedAmount));
                              setWaiverDeletePayload({
                                month: item.month,
                                lateFee: Number(item.lateFee ?? 0),
                                lateFeePaid: Number(item.lateFeePaid ?? 0),
                                waivedAmount,
                                payableLateFee: Number(item.payableLateFee ?? 0),
                              });
                            }}
                            className="inline-flex min-w-[112px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" /> Delete Waiver
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {(feeCalculation.monthlyDetails?.length || feeCalculation.busDetails?.length) ? (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {feeCalculation.monthlyDetails?.length ? (
                <CalculationMonths title="Monthly Fee Accrual" items={feeCalculation.monthlyDetails.map((item: any) => ({ month: item.month, amount: item.effectiveMonthlyFee, detail: `Class ${item.className}-${item.section}` }))} />
              ) : null}
              {feeCalculation.busDetails?.length ? (
                <CalculationMonths title="Bus Fee Accrual" items={feeCalculation.busDetails.map((item: any) => ({ month: item.month, amount: item.effectiveBusFee, detail: item.firstMonthProrated ? 'Prorated' : 'Full month' }))} />
              ) : null}
            </div>
          ) : null}

          {feeCalculation.waivedMonthlyFeeMonths?.length ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Waived Monthly Fee Months</p>
              <div className="flex flex-wrap gap-2">
                {feeCalculation.waivedMonthlyFeeMonths.map((month: any) => (
                  <span key={month.month} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{month.monthName}: {month.reason}</span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      <PaymentModal student={student} open={paying} onClose={() => setPaying(false)} onDone={setReceipt} />
      <StudentPaymentHistoryModal student={student} open={historyOpen} onClose={() => setHistoryOpen(false)} onViewReceipt={setReceipt} />
      <ReceiptModal payment={receipt} student={student} onClose={() => setReceipt(null)} />
      <StudentFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          void loadStudent();
        }}
        editing={student}
      />

      <Modal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Promote Student"
        subtitle={student ? `${student.name} · ${student.studentId}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button
              disabled={promoteSaving}
              onClick={async () => {
                if (!student || !promoteForm.toClass || !promoteForm.section) {
                  toast.error('Class and section are required.');
                  return;
                }
                try {
                  setPromoteSaving(true);
                  await api.post(`${API.STUDENTS}/promote`, {
                    studentId: student.studentId,
                    toClass: promoteForm.toClass,
                    section: promoteForm.section,
                    remarks: promoteForm.remarks.trim(),
                  });
                  toast.success('Student promoted successfully.');
                  setPromoteOpen(false);
                  await dispatch(fetchStudents());
                  await loadStudent();
                } catch (error: any) {
                  toast.error(error?.response?.data?.message ?? 'Unable to promote student.');
                } finally {
                  setPromoteSaving(false);
                }
              }}
            >
              {promoteSaving ? 'Promoting...' : 'Promote Student'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Promote To Class" required>
            <Select value={promoteForm.toClass} onChange={(e) => setPromoteForm((form) => ({ ...form, toClass: e.target.value }))}>
              <option value="">Select Class</option>
              {CLASS_OPTIONS.map((item) => <option key={item.value} value={item.value} disabled={item.value === student?.className}>{item.label}</option>)}
            </Select>
          </Field>
          <Field label="Section" required>
            <Select value={promoteForm.section} onChange={(e) => setPromoteForm((form) => ({ ...form, section: e.target.value }))}>
              {['A', 'B', 'C', 'D'].map((section) => <option key={section} value={section}>{section}</option>)}
            </Select>
          </Field>
          <Field label="Remarks" className="sm:col-span-2">
            <Input value={promoteForm.remarks} onChange={(e) => setPromoteForm((form) => ({ ...form, remarks: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      <CommonConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (!student) return;
          void dispatch(deleteStudent(student._id)).unwrap().then(async () => {
            toast.success('Student deleted.');
            await dispatch(fetchStudents());
            navigate('/admin/students');
          }).catch((error) => toast.error(String(error ?? 'Unable to delete student.')));
        }}
        title="Delete student?"
        message={`This will permanently remove ${student?.name} and all their payment records. This action cannot be undone.`}
        confirmLabel="Delete Student"
      />

      <Modal
        open={Boolean(waiverDeletePayload)}
        onClose={() => {
          setWaiverDeletePayload(null);
          setWaiverDeleteAmount('');
        }}
        title="Delete Late Fee Waiver"
        subtitle={waiverDeletePayload ? `Month ${waiverDeletePayload.month}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setWaiverDeletePayload(null);
              setWaiverDeleteAmount('');
            }}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!student || !waiverDeletePayload || waiverDeleteAmount.trim() === '') {
                  toast.error('Waiver amount is required.');
                  return;
                }
                void api.delete(`${API.FEES}/late-fee/waiver/${student.studentId}/${waiverDeletePayload.month}`, {
                  data: { ...waiverDeletePayload, waivedAmount: Number(waiverDeleteAmount) },
                })
                  .then(async () => {
                    toast.success('Late fee waiver deleted successfully.');
                    setWaiverDeletePayload(null);
                    setWaiverDeleteAmount('');
                    await loadStudent();
                  })
                  .catch((error: any) => toast.error(error?.response?.data?.message ?? 'Unable to delete late fee waiver.'));
              }}
            >Delete Waiver</Button>
          </>
        }
      >
        <Field label="Waiver Amount" required>
          <Input
            type="text"
            inputMode="decimal"
            value={waiverDeleteAmount}
            onChange={(event) => /^\d*(\.\d{0,2})?$/.test(event.target.value) && setWaiverDeleteAmount(event.target.value)}
            placeholder="Enter waiver amount"
          />
        </Field>
      </Modal>

      <Modal
        open={lateFeeOpen}
        onClose={() => setLateFeeOpen(false)}
        title="Waive Late Fee"
        subtitle={student ? `${student.name} · ${student.studentId}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setLateFeeOpen(false)}>Cancel</Button>
            <Button disabled={lateFeeSaving} onClick={() => void waiveLateFee()}>{lateFeeSaving ? 'Saving...' : 'Waive Late Fee'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fee Month" required>
            <Select value={lateFeeForm.month} onChange={(e) => setLateFeeForm((form) => ({ ...form, month: e.target.value }))}>
              <option value="">Select late fee</option>
              {(feeCalculation?.lateFeeDetails ?? [])
                .filter((item: any) => Number(item.payableLateFee ?? 0) > 0)
                .map((item: any) => (
                  <option key={item.month} value={item.month}>
                    {item.month} - {formatCurrency(item.payableLateFee ?? 0)} payable
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Waiver Type" required>
            <Select value={lateFeeForm.waiverType} onChange={(e) => setLateFeeForm((form) => ({ ...form, waiverType: e.target.value, waivedAmount: '' }))}>
              <option value="AMOUNT">Fixed Amount</option>
              <option value="FULL">Full Late Fee</option>
            </Select>
          </Field>
          {lateFeeForm.waiverType === 'AMOUNT' ? (
            <Field label="Waived Amount" required className="sm:col-span-2">
              <Input
                type="text"
                inputMode="decimal"
                value={lateFeeForm.waivedAmount}
                onChange={(e) => /^\d*(\.\d{0,2})?$/.test(e.target.value) && setLateFeeForm((form) => ({ ...form, waivedAmount: e.target.value }))}
              />
            </Field>
          ) : null}
          <Field label="Reason" required className="sm:col-span-2">
            <Textarea placeholder="Principal approval" value={lateFeeForm.reason} onChange={(e) => setLateFeeForm((form) => ({ ...form, reason: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={busAction === 'start'}
        onClose={() => setBusAction(null)}
        title="Start Bus Facility"
        subtitle={student ? `${student.name} · ${student.studentId}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setBusAction(null)}>Cancel</Button>
            <Button disabled={busSaving} onClick={() => void startBusFacility()}>{busSaving ? 'Starting...' : 'Start Bus Facility'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Effective From" required>
            <Input type="date" value={startForm.effectiveFrom} onChange={(e) => setStartForm((form) => ({ ...form, effectiveFrom: e.target.value }))} />
          </Field>
          <Field label="Monthly Bus Fee" required>
            <Input type="text" inputMode="decimal" value={startForm.busFee} onChange={(e) => /^\d*(\.\d{0,2})?$/.test(e.target.value) && setStartForm((form) => ({ ...form, busFee: e.target.value }))} />
          </Field>
          <Field label="Reason" required className="sm:col-span-2">
            <Textarea placeholder="Reason for starting bus facility" value={startForm.reason} onChange={(e) => setStartForm((form) => ({ ...form, reason: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={busAction === 'stop'}
        onClose={() => { setBusAction(null); setStopPreview(null); }}
        title="Stop Bus Facility"
        subtitle={student ? `${student.name} · ${student.studentId}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => { setBusAction(null); setStopPreview(null); }}>Cancel</Button>
            {stopPreview ? (
              <Button variant="danger" disabled={busSaving} onClick={() => void stopBusFacility()}>{busSaving ? 'Stopping...' : 'Confirm & Stop'}</Button>
            ) : (
              <Button disabled={busSaving} onClick={() => void previewBusStop()}>{busSaving ? 'Calculating...' : 'Preview Refund'}</Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Effective From" required>
              <Input type="date" value={stopForm.effectiveFrom} onChange={(e) => { setStopPreview(null); setStopForm((form) => ({ ...form, effectiveFrom: e.target.value })); }} />
            </Field>
            <Field label="Refund Mode" required>
              <Select value={stopForm.refundMode} onChange={(e) => { setStopPreview(null); setStopForm((form) => ({ ...form, refundMode: e.target.value })); }}>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank Transfer</option>
                <option value="UPI">UPI</option>
              </Select>
            </Field>
            <Field label="Reason" required className="sm:col-span-2">
              <Textarea value={stopForm.reason} onChange={(e) => { setStopPreview(null); setStopForm((form) => ({ ...form, reason: e.target.value })); }} />
            </Field>
          </div>

          {stopPreview ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PreviewStat label="Monthly Bus Fee" value={formatCurrency(stopPreview.monthlyBusFee ?? 0)} />
                <PreviewStat label="Net Bus Fee Paid" value={formatCurrency(stopPreview.netBusFeePaid ?? 0)} />
                <PreviewStat label="Used Bus Fee" value={formatCurrency(stopPreview.usedBusFee ?? 0)} />
                <PreviewStat label="Refund Amount" value={formatCurrency(stopPreview.refundAmount ?? 0)} tone="text-emerald-600" />
                <PreviewStat label="Used Months" value={String(stopPreview.usedBusMonths ?? 0)} />
                <PreviewStat label="Last Charge Date" value={formatDate(stopPreview.lastBusChargeDate || '')} />
                <PreviewStat label="Previous Refunds" value={formatCurrency(stopPreview.previousBusRefunds ?? 0)} />
                <PreviewStat label="Net Total Paid" value={formatCurrency(stopPreview.netTotalFeePaid ?? 0)} />
              </div>
              {stopPreview.waivedBusFeeMonths?.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Waived Bus Months</p>
                  <div className="flex flex-wrap gap-2">
                    {stopPreview.waivedBusFeeMonths.map((month: any) => (
                      <span key={month.month} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">{month.monthName}: {month.reason}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {Number(stopPreview.refundAmount ?? 0) > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Refund Received By" required={stopForm.refundMode === 'CASH'}>
                    <Input value={stopForm.receivedBy} onChange={(e) => setStopForm((form) => ({ ...form, receivedBy: e.target.value }))} />
                  </Field>
                  <Field label="Refund Remarks">
                    <Input value={stopForm.remarks} onChange={(e) => setStopForm((form) => ({ ...form, remarks: e.target.value }))} />
                  </Field>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function CalculationMonths({ title, items }: { title: string; items: Array<{ month: string; amount: number; detail: string }> }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="mb-3 text-xs font-semibold uppercase text-slate-400">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.month} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
            <div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.month}</p><p className="text-xs text-slate-400">{item.detail}</p></div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount ?? 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
