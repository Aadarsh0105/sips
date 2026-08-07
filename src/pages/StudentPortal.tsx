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
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDate } from "../lib/utils";

const CAMPUS = "/0cff149f-67fb-4097-8cd3-d6d7bfb6e95a.jpg";

export function StudentPortal() {
  const dispatch = useAppDispatch();
  const { student, loading, error } = useAppSelector((state) => state.studentSearch);
  const { settings } = useData();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
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
  });
  const lumpSumPreview = student?.lumpSumPreview ?? null;

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

  const currentMonth = new Date().getMonth() + 1;
  const isLumpSumSeason = currentMonth >= 3 && currentMonth <= 8;
  const canShowLumpSum = Boolean(student && isLumpSumSeason && lumpSumPreview?.eligible);

  const openPaymentModal = () => {
    if (!student) return;
    setPaymentForm({
      paymentType: canShowLumpSum ? "LUMP_SUM" : "REGULAR",
      amount: String(
        canShowLumpSum
          ? (lumpSumPreview?.lumpSumAmount ?? student.dueFee ?? student.totalFee)
          : (student.dueFee || student.totalFee)
      ),
    });
    setQrOpen(true);
  };

  const createQr = async () => {
    if (!student) return;
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      setQrLoading(true);
      const response = await api.post(API.FEES_ONLINE_CREATE_QR, {
        studentId: student.studentId,
        feeHead: "MONTHLY",
        amount,
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SchoolLogo logo={settings.logo} name={settings.name} className="ring-2 ring-white/30" />
            <span className="font-display text-lg font-extrabold text-white drop-shadow">
              {settings.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Link to="/login">
              <Button className="shadow-lg">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto w-full max-w-md rounded-3xl border border-white/20 bg-white p-7 shadow-2xl dark:bg-slate-900"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Find your fee details
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Secure lookup for students &amp; parents
                  </p>
                </div>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Student ID or Mobile Number
                  </label>
                  <Input
                    placeholder="e.g. SIPS000005 or 9876543211"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
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
        {student ? (
          <StudentCard student={student} onPay={openPaymentModal} />
        ) : searched ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <SearchIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              No matching student found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {error ?? "Please verify the Student ID or mobile number, then try again."}
            </p>
          </div>
        ) : null}
      </section>

      <GenerateQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        student={student}
        form={paymentForm}
        loading={qrLoading}
        onChangeForm={setPaymentForm}
        onSubmit={createQr}
        canShowLumpSum={canShowLumpSum}
        lumpSumPreview={lumpSumPreview}
      />

      <QrPreviewModal
        open={Boolean(qrData)}
        qrData={qrData}
        student={student}
        onClose={() => setQrData(null)}
      />

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center sm:px-6 lg:px-8">
          <SchoolLogo logo={settings.logo} name={settings.name} size="sm" />
          <p className="font-display font-bold text-slate-800 dark:text-white">{settings.name}</p>
          <p className="text-sm text-slate-500">{settings.address}</p>
          <p className="text-sm text-slate-500">
            {settings.contact} · {settings.email}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StudentCard({ student, onPay }: { student: any; onPay: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Student Found
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
            {student.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {student.studentId} · Class {student.className}-{student.section}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {student.status}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoTile label="Date of Birth" value={formatDate(student.dob)} />
        <InfoTile label="Father Name" value={student.fatherName || "-"} />
        <InfoTile label="Mother Name" value={student.motherName || "-"} />
        <InfoTile label="Mobile" value={student.mobile || "-"} />
        <InfoTile label="Email" value={student.email || "-"} />
        <InfoTile label="Admission No" value={student.admissionNo || "-"} />
        <InfoTile label="Monthly Fee" value={`₹${student.monthlyFee ?? 0}`} />
        <InfoTile label="Due Fee" value={`₹${student.dueFee ?? 0}`} />
      </div>

      <div className="mt-6 flex justify-end">
        {student.dueFee > 0 || (new Date().getMonth() + 1 >= 3 && new Date().getMonth() + 1 <= 8 && student.dueFee <= 0) ? (
          <Button onClick={onPay}>
            <WalletIcon className="h-4 w-4" /> {student.dueFee > 0 ? "Pay Fee" : "Pay Lump Sum"}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

function GenerateQrModal({
  open,
  onClose,
  student,
  form,
  loading,
  onChangeForm,
  onSubmit,
  canShowLumpSum,
  lumpSumPreview,
}: {
  open: boolean;
  onClose: () => void;
  student: any;
  form: { paymentType: string; amount: string };
  loading: boolean;
  onChangeForm: React.Dispatch<React.SetStateAction<{ paymentType: string; amount: string }>>;
  onSubmit: () => void;
  canShowLumpSum: boolean;
  lumpSumPreview: any;
}) {
  if (!student) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Payment QR"
      subtitle={`${student.name} · ${student.studentId}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading}>{loading ? "Processing..." : "Pay now"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Payment Type" required>
            <Select
            value={form.paymentType}
            onChange={(e) => onChangeForm((current) => ({
              ...current,
              paymentType: e.target.value,
              amount: e.target.value === "LUMP_SUM" && canShowLumpSum
                ? String(lumpSumPreview?.lumpSumAmount ?? student.dueFee ?? student.totalFee)
                : String(student.dueFee || student.totalFee),
            }))}
          >
                <option value="REGULAR">Regular Payment</option>
            {canShowLumpSum ? <option value="LUMP_SUM">Lump Sum</option> : null}
          </Select>
        </Field>
        <Field label="Amount" required>
          <Input
            type="text"
            value={form.amount}
            disabled={form.paymentType === "LUMP_SUM"}
            onChange={(e) => onChangeForm((current) => ({ ...current, amount: e.target.value }))}
          />
        </Field>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
          After generating the QR, you’ll see the payment code with the exact amount and can scan it to pay securely.
        </div>
      </div>
    </Modal>
  );
}

function QrPreviewModal({
  open,
  qrData,
  student,
  onClose,
}: {
  open: boolean;
  qrData: any | null;
  student: any;
  onClose: () => void;
}) {
  if (!qrData || !student) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payment QR Generated"
      subtitle={`${student.name} · ${qrData.paymentType}`}
      size="md"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <img src={qrData.imageUrl} alt="Payment QR" className="h-72 w-72 object-contain" />
        </div>
        <div>
          <p className="text-xs text-slate-400">QR ID</p>
          <p className="font-semibold text-slate-900 dark:text-white">{qrData.qrId}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Amount</p>
            <p className="font-semibold text-slate-900 dark:text-white">₹{qrData.amount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Status</p>
            <p className="font-semibold text-amber-600">PENDING</p>
          </div>
        </div>
      </div>
    </Modal>
  );
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
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-5 w-5" /> {text}
    </span>
  );
}
