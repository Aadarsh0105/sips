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

function getAdmissionPrefix(className: string) {
  return className ? `ADM-${className}` : 'ADM-';
}

type FormState = {
  admissionNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  email: string;
  gender: Gender;
  dob: string;
  className: string;
  section: string;
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

const schema: yup.ObjectSchema<any> = yup.object({
  admissionNo: yup.string().required('Admission no is required'),
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
  address: yup.string().required('Address is required'),
  admissionDate: yup.string().required('Admission date is required'),
  totalFee: yup.number().typeError('Total fee must be a number').min(0, 'Total fee cannot be negative').required(),
});

const empty: FormState = {
  admissionNo: '',
  name: '',
  fatherName: '',
  motherName: '',
  mobile: '',
  email: '',
  gender: 'MALE',
  dob: '',
  className: '',
  section: 'A',
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

  const admissionPrefix = getAdmissionPrefix(form.className);
  const admissionSuffix = form.admissionNo.startsWith(admissionPrefix)
    ? form.admissionNo.slice(admissionPrefix.length)
    : form.admissionNo;

  useEffect(() => {
    if (editing) {
      const prefix = getAdmissionPrefix(editing.className);
      const suffix = editing.admissionNo.startsWith(prefix)
        ? editing.admissionNo.slice(prefix.length)
        : editing.admissionNo.replace(/^ADM-/, '');
      setForm({
        admissionNo: `${prefix}${suffix}`,
        name: editing.name,
        fatherName: editing.fatherName,
        motherName: editing.motherName,
        mobile: editing.mobile,
        email: editing.email,
        gender: editing.gender as Gender,
        dob: editing.dob.slice(0, 10),
        className: editing.className,
        section: editing.section,
        address: editing.address,
        admissionDate: editing.admissionDate?.slice(0, 10) ?? '',
        totalFee: editing.totalFee,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [editing, open]);

  useEffect(() => {
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
  }, [form.className]);

  useEffect(() => {
    const computedTotal =
      feeStructure.admissionFee +
      feeStructure.monthlyFee +
      feeStructure.examFee +
      feeStructure.sportFee +
      feeStructure.computerFee +
      feeStructure.functionFee +
      feeStructure.smartClassFee +
      feeStructure.otherCharges;
    setForm((current) => (current.totalFee === computedTotal ? current : { ...current, totalFee: computedTotal }));
  }, [feeStructure]);

  const set = <K extends keyof FormState,>(key: K, value: FormState[K]) =>
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'className') {
        const classValue = String(value).trim();
        next.admissionNo = classValue ? `${getAdmissionPrefix(classValue)}` : '';
      }
      return next;
    });

  const submit = async () => {
    try {
      const valid = await schema.validate(form, { abortEarly: false });
      setErrors({});
      const payload = {
        admissionNo: valid.admissionNo,
        name: valid.name,
        fatherName: valid.fatherName,
        motherName: valid.motherName,
        mobile: valid.mobile,
        email: valid.email,
        gender: valid.gender,
        dob: valid.dob,
        className: valid.className,
        section: valid.section,
        address: valid.address,
        admissionDate: valid.admissionDate,
        admissionFee: feeStructure.admissionFee,
        monthlyFee: feeStructure.monthlyFee,
        examFee: feeStructure.examFee,
        sportFee: feeStructure.sportFee,
        computerFee: feeStructure.computerFee,
        functionFee: feeStructure.functionFee,
        smartClassFee: feeStructure.smartClassFee,
        otherCharges: feeStructure.otherCharges,
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
        <Field label="Admission Date" required>
          <Input type="date" value={form.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} />
          {errors.admissionDate ? <p className="mt-1 text-xs text-rose-500">{errors.admissionDate}</p> : null}
        </Field>
        {form.className ? (
          <>
            <Field label="Admission No" required>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900">
                <span className="flex shrink-0 items-center whitespace-nowrap border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {admissionPrefix}
                </span>

                <Input
                  className="rounded-none border-0 shadow-none focus:ring-0"
                  value={admissionSuffix}
                  onChange={(e) => set('admissionNo', `${admissionPrefix}${e.target.value}`)}
                />
              </div>

              {errors.admissionNo ? (
                <p className="mt-1 text-xs text-rose-500">{errors.admissionNo}</p>
              ) : null}
            </Field>
            <Field label="Admission Fee">
              <Input type="text" value={String(feeStructure.admissionFee)} disabled />
            </Field>
            <Field label="Monthly Fee">
              <Input type="text" value={String(feeStructure.monthlyFee)} disabled />
            </Field>
            <Field label="Exam Fee">
              <Input type="text" value={String(feeStructure.examFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, examFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Sport Fee">
              <Input type="text" value={String(feeStructure.sportFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, sportFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Computer Fee">
              <Input type="text" value={String(feeStructure.computerFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, computerFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Function Fee">
              <Input type="text" value={String(feeStructure.functionFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, functionFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Smart Class Fee">
              <Input type="text" value={String(feeStructure.smartClassFee)} onChange={(e) => setFeeStructure((current) => ({ ...current, smartClassFee: Number(e.target.value) }))} />
            </Field>
            <Field label="Other Charges">
              <Input type="text" value={String(feeStructure.otherCharges)} onChange={(e) => setFeeStructure((current) => ({ ...current, otherCharges: Number(e.target.value) }))} />
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
