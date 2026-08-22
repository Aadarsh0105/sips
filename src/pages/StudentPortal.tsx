import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheckIcon,
  ClockIcon,
  MoonIcon,
  SearchIcon,
  ShieldCheckIcon,
  SunIcon,
  WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/axios";
import { API } from "../api/endpoints";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { clearStudentSearch, searchStudent } from "../features/studentSearch/studentSearchSlice";
import { SchoolLogo } from "../components/shared/SchoolLogo";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { StudentDetailModal } from "../components/students/StudentDetailModal";
import { StudentPaymentHistoryModal } from "../components/students/StudentPaymentHistoryModal";
import { ReceiptModal } from "../components/shared/ReceiptModal";
import { StudentChatbot } from "../components/portal/StudentChatbot";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDate } from "../lib/utils";
import type { StudentRecord } from "../features/students/studentsSlice";
import type { Payment, Student } from "../lib/types";

const CAMPUS = "/0cff149f-67fb-4097-8cd3-d6d7bfb6e95a.jpg";

export function StudentPortal() {
  const dispatch = useAppDispatch();
  const { student, loading, error } = useAppSelector((state) => state.studentSearch);
  const { settings } = useData();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentRecord | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState<{
    qrId: string;
    imageUrl: string;
    paymentType: string;
    amount: number;
    feeHead: string;
    lumpSumDetails: any;
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentType: "REGULAR",
    amount: "",
    feeHeads: ["ALL"] as string[],
    feeMonths: { MONTHLY: [] as string[], BUS: [] as string[] },
  });
  const [feeCalculation, setFeeCalculation] = useState<any | null>(null);
  const [paymentLumpSumPreview, setPaymentLumpSumPreview] = useState<any | null>(null);

  const lumpSumPreview = paymentLumpSumPreview ?? selectedStudent?.lumpSumPreview ?? null;
  const currentMonth = new Date().getMonth() + 1;
  const isLumpSumSeason = currentMonth >= 3 && currentMonth <= 8;
  const canShowLumpSum = Boolean(selectedStudent && isLumpSumSeason && lumpSumPreview?.eligible);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) {
      toast.error("Please enter a Student ID or mobile number.");
      return;
    }
    setSearched(true);
    dispatch(clearStudentSearch());
    const resultAction = await dispatch(searchStudent(value));
    if (searchStudent.fulfilled.match(resultAction)) {
      toast.success(`Student Found`);
      return;
    }
    toast.error((resultAction.payload as string) ?? "No student found.");
  };

  const openPaymentModal = async () => {
    if (!selectedStudent) return;
    try {
      const [calculationResponse, previewResponse] = await Promise.all([
        api.post(`${API.FEES}/calculate`, { studentId: selectedStudent.studentId, feeHead: "ALL" }),
        isLumpSumSeason
          ? api.get(`${API.FEES}/lump-sum-preview/${selectedStudent.studentId}`).catch(() => null)
          : Promise.resolve(null),
      ]);
      const calculationData = calculationResponse?.data?.data ?? null;
      const previewData = previewResponse?.data?.data ?? null;
      const lumpSumAvailable = Boolean(
        isLumpSumSeason &&
        previewData?.eligible &&
        Number(previewData?.lumpSumAmount ?? 0) > 0
      );
      const regularDue = Number(calculationData?.dueFee ?? 0);
      const defaultPaymentType = regularDue <= 0 && lumpSumAvailable ? "LUMP_SUM" : "REGULAR";
      setFeeCalculation(calculationData);
      setPaymentLumpSumPreview(previewData);
      setSelectedStudent((current: any) => current ? { ...current, lumpSumPreview: previewData ?? current.lumpSumPreview } : current);
      setPaymentForm({
        paymentType: defaultPaymentType,
        amount: String(defaultPaymentType === "LUMP_SUM" ? previewData.lumpSumAmount : regularDue),
        feeHeads: ["ALL"],
        feeMonths: { MONTHLY: [], BUS: [] },
      });
    } catch {
      setFeeCalculation(null);
      setPaymentLumpSumPreview(null);
      toast.error("Unable to calculate payable fees.");
      return;
    }
    setQrOpen(true);
  };

  const openStudentDetails = async (item: any) => {
    const recordId = item.id ?? item._id;
    if (!recordId) {
      toast.error('Student record ID is missing.');
      return;
    }
    try {
      setDetailLoadingId(item.studentId);
      const [detailResponse, calculationResponse] = await Promise.all([
        api.get(`${API.STUDENTS}/${recordId}`),
        api.post(`${API.FEES}/calculate`, { studentId: item.studentId, feeHead: "ALL" }),
      ]);
      const detail = detailResponse?.data?.data;
      if (!detail) throw new Error('Student details not found');
      setFeeCalculation(calculationResponse?.data?.data ?? null);
      setSelectedStudent({ ...item, ...detail, lumpSumPreview: item.lumpSumPreview });
      setSelectedStudentDetail(detail as StudentRecord);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to load student details.');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const createQr = async () => {
    if (!selectedStudent) return;
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    const isLumpSum = paymentForm.paymentType === "LUMP_SUM";
    const monthOptions = getPortalMonthOptions(feeCalculation);
    const selectedDue = paymentForm.feeHeads.includes("ALL")
      ? Number(feeCalculation?.dueFee ?? selectedStudent.dueFee ?? 0)
      : paymentForm.feeHeads.reduce((sum, head) => sum + (
        head === "MONTHLY" || head === "BUS"
          ? monthOptions[head].filter((item) => paymentForm.feeMonths[head].includes(item.month)).reduce((monthSum, item) => monthSum + item.due, 0)
          : Number(feeCalculation?.dueBreakdown?.[head] ?? 0)
      ), 0);
    if (!isLumpSum && !paymentForm.feeHeads.length) {
      toast.error("Select at least one fee head.");
      return;
    }
    if (!isLumpSum && amount > selectedDue) {
      toast.error(`Amount cannot exceed ₹${selectedDue}.`);
      return;
    }
    const selectedHeads = paymentForm.feeHeads.includes("ALL")
      ? Object.keys(feeCalculation?.dueBreakdown ?? {}).filter((head) => head !== "ALL")
      : paymentForm.feeHeads;
    let balance = amount;
    const feeBreakdown = selectedHeads.reduce<Record<string, number>>((breakdown, head) => {
      const due = !paymentForm.feeHeads.includes("ALL") && (head === "MONTHLY" || head === "BUS")
        ? monthOptions[head].filter((item) => paymentForm.feeMonths[head].includes(item.month)).reduce((sum, item) => sum + item.due, 0)
        : Number(feeCalculation?.dueBreakdown?.[head] ?? 0);
      const allocated = Math.min(due, balance);
      if (allocated > 0) breakdown[head] = allocated;
      balance -= allocated;
      return breakdown;
    }, {});
    try {
      setQrLoading(true);
      const response = await api.post(API.FEES_ONLINE_CREATE_QR, {
        studentId: selectedStudent.studentId,
        feeHead: isLumpSum ? "MONTHLY" : paymentForm.feeHeads.includes("ALL") ? "ALL" : paymentForm.feeHeads,
        amount,
        ...(!isLumpSum ? {
          feeBreakdown,
          // feeMonths: paymentForm.feeMonths,
        } : {}),
        paymentType: paymentForm.paymentType,
      });
      const data = response?.data?.data;
      setQrData(data ?? null);
      setQrOpen(false);
      toast.success("Payment QR generated successfully.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Unable to generate payment QR.");
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <SchoolLogo logo={settings.logo} name={settings.name} size="sm" className="shrink-0 ring-2 ring-white/30 sm:h-11 sm:w-11" />
            <span className="min-w-0 font-display text-sm font-extrabold leading-tight text-white drop-shadow sm:text-lg">{settings.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 sm:h-10 sm:w-10"
            >
              {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Link to="/login">
              <Button size="sm" className="px-2 text-[11px] shadow-lg sm:h-10 sm:px-4 sm:text-sm">
                <ShieldCheckIcon className="h-4 w-4" /> Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={CAMPUS} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/85 via-brand-900/80 to-brand-950/90" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <BadgeCheckIcon className="h-4 w-4" /> Student Fee Portal
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Check your fees &amp; pay securely without login.
              </h1>
              <p className="mt-4 max-w-lg text-lg text-brand-100">
                Enter your Student ID or registered mobile number to view fee details instantly.
              </p>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-brand-100">
                <Feature icon={ClockIcon} text="Instant fee lookup" />
                <Feature icon={WalletIcon} text="UPI QR payments" />
                <Feature icon={BadgeCheckIcon} text="Quick student search" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mx-auto w-full max-w-md rounded-3xl border border-white/20 bg-white p-7 shadow-2xl dark:bg-slate-900">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Find your fee details</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Secure lookup for students &amp; parents</p>
                </div>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Student ID or Mobile Number</label>
                  <Input placeholder="e.g. SIPS000005 or 9876543211" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  <SearchIcon className="h-5 w-5" /> {loading ? "Searching..." : "Search"}
                </Button>
              </form>

              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-400 dark:bg-slate-800/60">
                Search with either the Student ID or the registered mobile number.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {Array.isArray(student) && student.length > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Search Results</h3>
              <p className="text-sm text-slate-500">{student.length} students found</p>
            </div>
            <div className="space-y-3">
              {student.map((item: any) => (
                <div
                  key={item.studentId}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-brand-500/40 dark:hover:bg-slate-800"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.studentId} · {item.className}-{item.section} · {item.mobile}</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <p className="text-xs text-slate-400">Due</p>
                    <p className="font-semibold text-slate-900 dark:text-white">₹{item.dueFee}</p>
                    <Button size="sm" disabled={detailLoadingId === item.studentId} onClick={() => void openStudentDetails(item)}>
                      {detailLoadingId === item.studentId ? 'Loading...' : 'View'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searched ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <SearchIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">No matching student found</h3>
            <p className="mt-1 text-sm text-slate-500">{error ?? "Please verify the Student ID or mobile number, then try again."}</p>
          </div>
        ) : null}
      </section>

      <GenerateQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        student={selectedStudent}
        form={paymentForm}
        loading={qrLoading}
        onChangeForm={setPaymentForm}
        onSubmit={createQr}
        canShowLumpSum={canShowLumpSum}
        lumpSumPreview={lumpSumPreview}
        calculation={feeCalculation}
      />

      <QrPreviewModal open={Boolean(qrData)} qrData={qrData} student={selectedStudent} onClose={() => setQrData(null)} />

      <StudentDetailModal
        student={selectedStudentDetail}
        open={Boolean(selectedStudentDetail)}
        onClose={() => {
          setSelectedStudent(null);
          setSelectedStudentDetail(null);
          setFeeCalculation(null);
        }}
        feeCalculation={feeCalculation}
        onPay={Number(selectedStudentDetail?.dueFee ?? 0) > 0 ? openPaymentModal : undefined}
        onViewHistory={() => setHistoryOpen(true)}
        onViewReceipt={() => undefined}
      />

      <StudentPaymentHistoryModal
        student={selectedStudentDetail}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onViewReceipt={setReceipt}
      />

      <ReceiptModal
        payment={receipt}
        student={selectedStudentDetail ? mapPortalReceiptStudent(selectedStudentDetail) : null}
        onClose={() => setReceipt(null)}
      />

      <StudentChatbot />

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center sm:px-6 lg:px-8">
          <SchoolLogo logo={settings.logo} name={settings.name} size="sm" />
          <p className="font-display font-bold text-slate-800 dark:text-white">{settings.name}</p>
          <p className="text-sm text-slate-500">{settings.address}</p>
          <p className="text-sm text-slate-500">{settings.contact} · {settings.email}</p>
          <p className="mt-2 text-xs text-slate-400">© {new Date().getFullYear()} {settings.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function GenerateQrModal({ open, onClose, student, form, loading, onChangeForm, onSubmit, canShowLumpSum, lumpSumPreview, calculation }: {
  open: boolean;
  onClose: () => void;
  student: any;
  form: { paymentType: string; amount: string; feeHeads: string[]; feeMonths: { MONTHLY: string[]; BUS: string[] } };
  loading: boolean;
  onChangeForm: React.Dispatch<React.SetStateAction<{ paymentType: string; amount: string; feeHeads: string[]; feeMonths: { MONTHLY: string[]; BUS: string[] } }>>;
  onSubmit: () => void;
  canShowLumpSum: boolean;
  lumpSumPreview: any;
  calculation: any;
}) {
  if (!student) return null;
  const regularPayment = form.paymentType === "REGULAR";
  const monthOptions = getPortalMonthOptions(calculation);
  const selectedMonthTotal = (head: "MONTHLY" | "BUS") => monthOptions[head]
    .filter((item) => form.feeMonths[head].includes(item.month))
    .reduce((sum, item) => sum + item.due, 0);
  const selectedDue = form.feeHeads.includes("ALL")
    ? Number(calculation?.dueFee ?? student.dueFee ?? 0)
    : form.feeHeads.reduce((sum, head) => sum + (
      head === "MONTHLY" || head === "BUS" ? selectedMonthTotal(head) : Number(calculation?.dueBreakdown?.[head] ?? 0)
    ), 0);
  const feeHeads = Object.keys(calculation?.dueBreakdown ?? {}).filter((head) => head !== "ALL");
  return (
    <Modal open={open} onClose={onClose} title="Generate Payment QR" subtitle={`${student.name} · ${student.studentId}`} size="lg" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={onSubmit} disabled={loading}>{loading ? "Generating..." : "Generate QR"}</Button></>}>
      <div className="space-y-4">
        <Field label="Payment Type" required>
          <Select value={form.paymentType} onChange={(e) => onChangeForm((current) => ({ ...current, paymentType: e.target.value, feeHeads: ["ALL"], feeMonths: { MONTHLY: [], BUS: [] }, amount: e.target.value === "LUMP_SUM" && canShowLumpSum ? String(lumpSumPreview?.lumpSumAmount ?? student.dueFee ?? student.totalFee) : String(calculation?.dueFee ?? student.dueFee ?? student.totalFee) }))}>
            <option value="REGULAR">Regular Payment</option>
            {canShowLumpSum ? <option value="LUMP_SUM">Lump Sum</option> : null}
          </Select>
        </Field>
        {regularPayment ? (
          <Field label="Select Fees" required>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.feeHeads.includes("ALL")}
                  onChange={() => onChangeForm((current) => ({ ...current, feeHeads: current.feeHeads.includes("ALL") ? [] : ["ALL"], feeMonths: { MONTHLY: [], BUS: [] }, amount: "" }))}
                />
                All Fees
              </label>
              {feeHeads.map((head) => {
                const disabled = form.feeHeads.includes("ALL");
                return (
                  <label key={head} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${disabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "cursor-pointer bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={form.feeHeads.includes(head)}
                        onChange={() => onChangeForm((current) => {
                          const selected = current.feeHeads.includes(head);
                          const nextMonths = head === "MONTHLY" || head === "BUS"
                            ? { ...current.feeMonths, [head]: selected ? [] : monthOptions[head].map((item) => item.month) }
                            : current.feeMonths;
                          return {
                            ...current,
                            feeHeads: selected ? current.feeHeads.filter((item) => item !== head) : [...current.feeHeads.filter((item) => item !== "ALL"), head],
                            feeMonths: nextMonths,
                            amount: "",
                          };
                        })}
                      />
                      {head.replace(/_/g, " ")}
                    </span>
                    <strong>₹{Number(calculation?.dueBreakdown?.[head] ?? 0).toLocaleString("en-IN")}</strong>
                  </label>
                );
              })}
            </div>
          </Field>
        ) : (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Full-year Lump Sum</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The complete lump-sum amount must be paid together.</p>
            <p className="mt-2 font-display text-xl font-bold text-brand-700 dark:text-brand-300">₹{Number(lumpSumPreview?.lumpSumAmount ?? 0).toLocaleString("en-IN")}</p>
          </div>
        )}
        {regularPayment && (form.feeHeads.includes("MONTHLY") || form.feeHeads.includes("BUS")) ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["MONTHLY", "BUS"] as const).map((head) => form.feeHeads.includes(head) ? (
              <PortalMonthSelect
                key={head}
                label={`${head === "MONTHLY" ? "Monthly Fee" : "Bus Fee"} Months`}
                options={monthOptions[head]}
                selected={form.feeMonths[head]}
                onChange={(months) => onChangeForm((current) => {
                  const nextMonths = { ...current.feeMonths, [head]: months };
                  const total = current.feeHeads.reduce((sum, feeHead) => sum + (
                    feeHead === "MONTHLY" || feeHead === "BUS"
                      ? monthOptions[feeHead].filter((item) => nextMonths[feeHead].includes(item.month)).reduce((monthSum, item) => monthSum + item.due, 0)
                      : Number(calculation?.dueBreakdown?.[feeHead] ?? 0)
                  ), 0);
                  return { ...current, feeMonths: nextMonths, amount: String(total) };
                })}
              />
            ) : null)}
          </div>
        ) : null}
        <Field label="Amount" required>
          <Input
            type="text"
            inputMode="decimal"
            placeholder={regularPayment ? `Up to ${selectedDue}` : undefined}
            value={form.amount}
            disabled={!regularPayment}
            onChange={(e) => {
              if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) onChangeForm((current) => ({ ...current, amount: e.target.value }));
            }}
          />
          {regularPayment ? <p className="mt-1 text-xs text-slate-500">Maximum payable: ₹{selectedDue.toLocaleString("en-IN")}</p> : null}
        </Field>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">After generating the QR, you’ll see the payment code with the exact amount and can scan it to pay securely.</div>
      </div>
    </Modal>
  );
}

function getPortalMonthOptions(calculation: any) {
  return {
    MONTHLY: buildPortalDueMonths(calculation?.monthlyDetails ?? [], Number(calculation?.dueBreakdown?.MONTHLY ?? 0), "effectiveMonthlyFee"),
    BUS: buildPortalDueMonths(calculation?.busDetails ?? [], Number(calculation?.dueBreakdown?.BUS ?? 0), "effectiveBusFee"),
  };
}

function buildPortalDueMonths(items: any[], totalDue: number, amountKey: string) {
  const scheduledTotal = items.reduce((sum, item) => sum + Number(item?.[amountKey] ?? 0), 0);
  let paidBalance = Math.max(0, scheduledTotal - totalDue);
  return items.map((item) => {
    const amount = Number(item?.[amountKey] ?? 0);
    const paid = Math.min(amount, paidBalance);
    paidBalance -= paid;
    return { month: String(item.month), due: Math.max(0, amount - paid) };
  }).filter((item) => item.due > 0);
}

function PortalMonthSelect({ label, options, selected, onChange }: {
  label: string;
  options: Array<{ month: string; due: number }>;
  selected: string[];
  onChange: (months: string[]) => void;
}) {
  const allSelected = options.length > 0 && selected.length === options.length;
  return (
    <Field label={label} required>
      <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
        <label className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span className="flex items-center gap-2">
            <input type="checkbox" checked={allSelected} onChange={() => onChange(allSelected ? [] : options.map((item) => item.month))} />
            All due months
          </span>
          <span>₹{options.reduce((sum, item) => sum + item.due, 0).toLocaleString("en-IN")}</span>
        </label>
        <div className="mt-1 max-h-36 space-y-1 overflow-y-auto">
          {options.map((item) => (
            <label key={item.month} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(item.month)} onChange={() => onChange(selected.includes(item.month) ? selected.filter((month) => month !== item.month) : [...selected, item.month])} />
                {item.month}
              </span>
              <strong>₹{item.due.toLocaleString("en-IN")}</strong>
            </label>
          ))}
          {!options.length ? <p className="px-3 py-2 text-xs text-slate-500">No due months.</p> : null}
        </div>
      </div>
    </Field>
  );
}

function QrPreviewModal({ open, qrData, student, onClose }: { open: boolean; qrData: any | null; student: any; onClose: () => void; }) {
  if (!qrData || !student) return null;
  return (
    <Modal open={open} onClose={onClose} title="Payment QR Generated" subtitle={`${student.name} · ${qrData.paymentType}`} size="lg" footer={<Button onClick={onClose}>Done</Button>}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <img src={qrData.imageUrl} alt="Payment QR" className="h-72 w-72 object-contain" />
        </div>
        <div><p className="text-xs text-slate-400">QR ID</p><p className="font-semibold text-slate-900 dark:text-white">{qrData.qrId}</p></div>
        <div className="grid w-full grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><p className="text-xs text-slate-400">Amount</p><p className="font-semibold text-slate-900 dark:text-white">₹{qrData.amount}</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><p className="text-xs text-slate-400">Status</p><p className="font-semibold text-amber-600">PENDING</p></div>
        </div>
      </div>
    </Modal>
  );
}

function mapPortalReceiptStudent(student: StudentRecord): Student {
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: any; text: string }) {
  return <span className="inline-flex items-center gap-2"><Icon className="h-5 w-5" /> {text}</span>;
}
