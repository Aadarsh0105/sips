import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { toast } from 'sonner';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createStudent, fetchStudents, updateStudent, type StudentRecord } from '../../features/students/studentsSlice';
import { CLASS_OPTIONS } from '../../lib/classes';
import type { Gender } from '../../lib/types';

const SECTIONS = ['A', 'B', 'C', 'D'];
const DISCOUNT_TYPE_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'SIBLING', label: 'Sibling' },
  { value: 'RTE', label: 'RTE' },
  { value: 'GIRLS_SPECIAL', label: 'Girls Special' },
] as const;

const FEE_START_FROM_OPTIONS = [
  { value: 'ADMISSION_DATE', label: 'From Admission Date' },
  { value: 'NEXT_MONTH', label: 'From Next Month of Admission' },
  { value: 'CUSTOM', label: 'Custom Date' },
] as const;

const ENV = import.meta.env as Record<string, string | undefined>;
const DISCOUNT_RULES = {
  siblingMonthlyPercent: Number(ENV.VITE_SIBLING_MONTHLY_DISCOUNT_PERCENT ?? 20),
  rteAllPercent: Number(ENV.VITE_RTE_FEES_DISCOUNT_PERCENT ?? 100),
  girlsAdmissionPercent: Number(ENV.VITE_GIRLS_ADMISSION_DISCOUNT_PERCENT ?? 50),
} as const;

type FormState = {
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  email: string;
  gender: Gender;
  dob: string;
  className: string;
  section: string;
  feeStartFrom: string;
  feeStartDate: string;
  feeDiscountType: string;
  address: string;
  admissionDate: string;
  totalFee: number;
};

type FeeStructureState = {
  admissionFee: number;
  monthlyFee: number;
  examFee: number;
  sportFee: number;
  computerFee: number;
  functionFee: number;
  smartClassFee: number;
  otherCharges: number;
};

type AppliedFeeStructureState = FeeStructureState & {
  admissionDiscount: number;
  monthlyDiscount: number;
  totalDiscount: number;
  totalFee: number;
};

const schema: yup.ObjectSchema<any> = yup.object({
  name: yup.string().required('Student name is required'),
  fatherName: yup.string().required('Father name is required'),
  motherName: yup.string().required('Mother name is required'),
  mobile: yup
    .string()
    .required('Mobile is required')
    .matches(/^[0-9]{10}$/, 'Enter a valid 10-digit mobile number'),
  email: yup.string().required('Email is required').email('Enter a valid email address'),
  gender: yup.string().required('Gender is required'),
  dob: yup.string().required('Date of birth is required'),
  className: yup.string().required('Class is required'),
  section: yup.string().required('Section is required'),
  feeStartFrom: yup.string().required('Fee start from is required'),
  feeStartDate: yup.string().when('feeStartFrom', {
    is: 'CUSTOM',
    then: (schema) => schema.required('Fee start date is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  feeDiscountType: yup.string().required('Discount type is required'),
  address: yup.string().required('Address is required'),
  admissionDate: yup.string().required('Admission date is required'),
  totalFee: yup.number().typeError('Total fee must be a number').min(0, 'Total fee cannot be negative').required(),
});

const empty: FormState = {
  name: '',
  fatherName: '',
  motherName: '',
  mobile: '',
  email: '',
  gender: 'MALE',
  dob: '',
  className: '',
  section: 'A',
  feeStartFrom: 'ADMISSION_DATE',
  feeStartDate: '',
  feeDiscountType: 'NONE',
  address: '',
  admissionDate: '',
  totalFee: 0,
};

const emptyFeeStructure: FeeStructureState = {
  admissionFee: 0,
  monthlyFee: 0,
  examFee: 0,
  sportFee: 0,
  computerFee: 0,
  functionFee: 0,
  smartClassFee: 0,
  otherCharges: 0,
};

const emptyAppliedFeeStructure: AppliedFeeStructureState = {
  ...emptyFeeStructure,
  admissionDiscount: 0,
  monthlyDiscount: 0,
  totalDiscount: 0,
  totalFee: 0,
};

function applyDiscounts(base: FeeStructureState, discountType: string): AppliedFeeStructureState {
  const normalizedDiscount = discountType?.toUpperCase?.() ?? 'NONE';
  const admissionDiscount =
    normalizedDiscount === 'GIRLS_SPECIAL'
      ? Math.round((base.admissionFee * DISCOUNT_RULES.girlsAdmissionPercent) / 100)
      : normalizedDiscount === 'RTE'
        ? base.admissionFee
        : 0;
  const monthlyDiscount =
    normalizedDiscount === 'SIBLING'
      ? Math.round((base.monthlyFee * DISCOUNT_RULES.siblingMonthlyPercent) / 100)
      : normalizedDiscount === 'RTE'
        ? base.monthlyFee
        : 0;
  const otherFeeDiscount =
    normalizedDiscount === 'RTE'
      ? base.examFee + base.sportFee + base.computerFee + base.functionFee + base.smartClassFee + base.otherCharges
      : 0;
  const totalDiscount = admissionDiscount + monthlyDiscount + otherFeeDiscount;
  const totalFee =
    Math.max(0, base.admissionFee - admissionDiscount) +
    Math.max(0, base.monthlyFee - monthlyDiscount) +
    Math.max(0, base.examFee - (normalizedDiscount === 'RTE' ? base.examFee : 0)) +
    Math.max(0, base.sportFee - (normalizedDiscount === 'RTE' ? base.sportFee : 0)) +
    Math.max(0, base.computerFee - (normalizedDiscount === 'RTE' ? base.computerFee : 0)) +
    Math.max(0, base.functionFee - (normalizedDiscount === 'RTE' ? base.functionFee : 0)) +
    Math.max(0, base.smartClassFee - (normalizedDiscount === 'RTE' ? base.smartClassFee : 0)) +
    Math.max(0, base.otherCharges - (normalizedDiscount === 'RTE' ? base.otherCharges : 0));

  return {
    ...base,
    admissionDiscount,
    monthlyDiscount,
    totalDiscount,
    admissionFee: Math.max(0, base.admissionFee - admissionDiscount),
    monthlyFee: Math.max(0, base.monthlyFee - monthlyDiscount),
    examFee: Math.max(0, base.examFee - (normalizedDiscount === 'RTE' ? base.examFee : 0)),
    sportFee: Math.max(0, base.sportFee - (normalizedDiscount === 'RTE' ? base.sportFee : 0)),
    computerFee: Math.max(0, base.computerFee - (normalizedDiscount === 'RTE' ? base.computerFee : 0)),
    functionFee: Math.max(0, base.functionFee - (normalizedDiscount === 'RTE' ? base.functionFee : 0)),
    smartClassFee: Math.max(0, base.smartClassFee - (normalizedDiscount === 'RTE' ? base.smartClassFee : 0)),
    otherCharges: Math.max(0, base.otherCharges - (normalizedDiscount === 'RTE' ? base.otherCharges : 0)),
    totalFee,
  };
}

export function StudentFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: StudentRecord | null;
}) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [feeStructure, setFeeStructure] = useState<FeeStructureState>(emptyFeeStructure);
  const [appliedFeeStructure, setAppliedFeeStructure] = useState<AppliedFeeStructureState>(emptyAppliedFeeStructure);

  useEffect(() => {
    if (editing) {
      const safeClassName = editing.className ?? '';
      setForm({
        name: editing.name ?? '',
        fatherName: editing.fatherName ?? '',
        motherName: editing.motherName ?? '',
        mobile: editing.mobile ?? '',
        email: editing.email ?? '',
        gender: (editing.gender as Gender) ?? 'MALE',
        dob: editing.dob?.slice(0, 10) ?? '',
        className: safeClassName,
        section: editing.section ?? 'A',
        feeStartFrom: (editing as any).feeStartFrom ?? 'ADMISSION_DATE',
        feeStartDate: (editing as any).feeStartDate?.slice(0, 10) ?? '',
        feeDiscountType: (editing as any).feeDiscountType ?? 'NONE',
        address: editing.address ?? '',
        admissionDate: editing.admissionDate?.slice(0, 10) ?? '',
        totalFee: editing.totalFee ?? 0,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [editing, open]);

  useEffect(() => {
    if (editing) {
      setFeeStructure({
        admissionFee: Number(editing.admissionFee ?? 0),
        monthlyFee: Number(editing.monthlyFee ?? 0),
        examFee: Number(editing.examFee ?? 0),
        sportFee: Number(editing.sportFee ?? 0),
        computerFee: Number(editing.computerFee ?? 0),
        functionFee: Number(editing.functionFee ?? 0),
        smartClassFee: Number(editing.smartClassFee ?? 0),
        otherCharges: Number(editing.otherCharges ?? 0),
      });
      return;
    }

    const selectedClass = form.className.trim();
    if (!selectedClass) {
      setFeeStructure(emptyFeeStructure);
      return;
    }

    void api
      .get(`${API.FEE_STRUCTURES}/class/${selectedClass}`)
      .then((response) => {
        const data = response?.data?.data;
        if (!data) {
          setFeeStructure(emptyFeeStructure);
          return;
        }
        setFeeStructure({
          admissionFee: Number(data.admissionFee ?? 0),
          monthlyFee: Number(data.monthlyFee ?? 0),
          examFee: Number(data.examFee ?? 0),
          sportFee: Number(data.sportFee ?? 0),
          computerFee: Number(data.computerFee ?? 0),
          functionFee: Number(data.functionFee ?? 0),
          smartClassFee: Number(data.smartClassFee ?? 0),
          otherCharges: Number(data.otherCharges ?? 0),
        });
      })
      .catch(() => {
        setFeeStructure(emptyFeeStructure);
      });
  }, [form.className, editing]);

  useEffect(() => {
    const applied = applyDiscounts(feeStructure, form.feeDiscountType);
    setAppliedFeeStructure(applied);
    setForm((current) => (current.totalFee === applied.totalFee ? current : { ...current, totalFee: applied.totalFee }));
  }, [feeStructure, form.feeDiscountType]);

  const set = <K extends keyof FormState,>(key: K, value: FormState[K]) =>
    setForm((current) => {
      const next = { ...current, [key]: value };
      return next;
    });

  const submit = async () => {
    try {
      const valid = await schema.validate(form, { abortEarly: false });
      setErrors({});
      const payload = {
        name: valid.name,
        fatherName: valid.fatherName,
        motherName: valid.motherName,
        mobile: valid.mobile,
        email: valid.email,
        gender: valid.gender,
        dob: valid.dob,
        className: valid.className,
        section: valid.section,
        feeStartFrom: valid.feeStartFrom,
        feeStartDate: valid.feeStartDate,
        feeDiscountType: valid.feeDiscountType,
        address: valid.address,
        admissionDate: valid.admissionDate,
        admissionFee: appliedFeeStructure.admissionFee,
        monthlyFee: appliedFeeStructure.monthlyFee,
        examFee: appliedFeeStructure.examFee,
        sportFee: appliedFeeStructure.sportFee,
        computerFee: appliedFeeStructure.computerFee,
        functionFee: appliedFeeStructure.functionFee,
        smartClassFee: appliedFeeStructure.smartClassFee,
        otherCharges: appliedFeeStructure.otherCharges,
      };
      if (editing) {
        void dispatch(updateStudent({ id: editing._id, payload: payload as any })).then(() => dispatch(fetchStudents()));
        toast.success('Student updated successfully.');
      } else {
        void dispatch(createStudent(payload as any)).then(() => dispatch(fetchStudents()));
        toast.success('Student added successfully.');
      }
      onClose();
    } catch (error: any) {
      if (error?.inner) {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        for (const item of error.inner) {
          if (item.path) nextErrors[item.path as keyof FormState] = item.message;
        }
        setErrors(nextErrors);
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editing ? 'Edit Student' : 'Add Student'}
      subtitle={editing ? editing.studentId : 'Student ID is generated automatically'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{editing ? 'Save Changes' : 'Add Student'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Student Name" required>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          {errors.name ? <p className="mt-1 text-xs text-rose-500">{errors.name}</p> : null}
        </Field>
        <Field label="Father's Name" required>
          <Input value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)} />
          {errors.fatherName ? <p className="mt-1 text-xs text-rose-500">{errors.fatherName}</p> : null}
        </Field>
        <Field label="Mother's Name" required>
          <Input value={form.motherName} onChange={(e) => set('motherName', e.target.value)} />
          {errors.motherName ? <p className="mt-1 text-xs text-rose-500">{errors.motherName}</p> : null}
        </Field>
        <Field label="Mobile" required>
          <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          {errors.mobile ? <p className="mt-1 text-xs text-rose-500">{errors.mobile}</p> : null}
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          {errors.email ? <p className="mt-1 text-xs text-rose-500">{errors.email}</p> : null}
        </Field>
        <Field label="Gender" required>
          <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
          {errors.gender ? <p className="mt-1 text-xs text-rose-500">{errors.gender}</p> : null}
        </Field>
        <Field label="Date of Birth" required>
          <Input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
          {errors.dob ? <p className="mt-1 text-xs text-rose-500">{errors.dob}</p> : null}
        </Field>
        <Field label="Class" required>
          <Select value={form.className} onChange={(e) => set('className', e.target.value)}>
            <option value="">Select class</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
          {errors.className ? <p className="mt-1 text-xs text-rose-500">{errors.className}</p> : null}
        </Field>
        <Field label="Section" required>
          <Select value={form.section} onChange={(e) => set('section', e.target.value)}>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          {errors.section ? <p className="mt-1 text-xs text-rose-500">{errors.section}</p> : null}
        </Field>
        <Field label="Admission Type" required>
          <Select value={form.feeDiscountType} onChange={(e) => set('feeDiscountType', e.target.value)}>
            {DISCOUNT_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          {errors.feeDiscountType ? <p className="mt-1 text-xs text-rose-500">{errors.feeDiscountType}</p> : null}
        </Field>
        <Field label="Admission Date" required>
          <Input type="date" value={form.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} />
          {errors.admissionDate ? <p className="mt-1 text-xs text-rose-500">{errors.admissionDate}</p> : null}
        </Field>
        <Field label="Fee Start From" required>
          <Select value={form.feeStartFrom} onChange={(e) => set('feeStartFrom', e.target.value)}>
            {FEE_START_FROM_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          {errors.feeStartFrom ? <p className="mt-1 text-xs text-rose-500">{errors.feeStartFrom}</p> : null}
        </Field>
        {form.feeStartFrom === 'CUSTOM' ? (
          <Field label="Fee Start Date" required>
            <Input type="date" value={form.feeStartDate} onChange={(e) => set('feeStartDate', e.target.value)} />
            {errors.feeStartDate ? <p className="mt-1 text-xs text-rose-500">{errors.feeStartDate}</p> : null}
          </Field>
        ) : null}
        {form.className ? (
          <>
            <Field label="Admission Fee">
              <Input type="text" value={String(appliedFeeStructure.admissionFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, admissionFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Monthly Fee">
              <Input type="text" value={String(appliedFeeStructure.monthlyFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, monthlyFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Exam Fee">
              <Input type="text" value={String(appliedFeeStructure.examFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, examFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Sport Fee">
              <Input type="text" value={String(appliedFeeStructure.sportFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, sportFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Computer Fee">
              <Input type="text" value={String(appliedFeeStructure.computerFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, computerFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Function Fee">
              <Input type="text" value={String(appliedFeeStructure.functionFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, functionFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Smart Class Fee">
              <Input type="text" value={String(appliedFeeStructure.smartClassFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, smartClassFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Other Charges">
              <Input type="text" value={String(appliedFeeStructure.otherCharges)} onChange={(e) => setFeeStructure((current) => ({ ...current, otherCharges: Number(e.target.value) }))} />
            </Field>
            <Field label="Total Fee" required>
              <Input type="text" value={String(form.totalFee)} disabled />
              {errors.totalFee ? <p className="mt-1 text-xs text-rose-500">{errors.totalFee}</p> : null}
            </Field>
          </>
        ) : null}
        <Field label="Address" className="sm:col-span-3" required>
          <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} />
          {errors.address ? <p className="mt-1 text-xs text-rose-500">{errors.address}</p> : null}
        </Field>
      </div>
    </Modal>
  );
}
