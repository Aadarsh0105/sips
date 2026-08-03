import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Input';
import type { FeeStructureRecord } from '../../features/feeStructures/feeStructuresSlice';
import { CLASS_OPTIONS } from '../../lib/classes';

type FormState = {
  className: string;
  admissionFee: string;
  monthlyFee: string;
  examFee: string;
  sportFee: string;
  computerFee: string;
  functionFee: string;
  smartClassFee: string;
  otherCharges: string;
};

type FeeStructurePayload = {
  className: string;
  admissionFee: number;
  monthlyFee: number;
  examFee: number;
  sportFee: number;
  computerFee: number;
  functionFee: number;
  smartClassFee: number;
  otherCharges: number;
};

const schema = yup.object({
  className: yup.string().required('Class is required'),
  admissionFee: yup
    .number()
    .typeError('Admission fee must be a number')
    .min(0, 'Admission fee must be 0 or more'),
  monthlyFee: yup
    .number()
    .required('Monthly fee is required')
    .typeError('Monthly fee must be a number')
    .min(0, 'Monthly fee must be 0 or more'),
  examFee: yup
    .number()
    .typeError('Exam fee must be a number')
    .min(0, 'Exam fee must be 0 or more'),
  sportFee: yup
    .number()
    .typeError('Sport fee must be a number')
    .min(0, 'Sport fee must be 0 or more'),
  computerFee: yup
    .number()
    .typeError('Computer fee must be a number')
    .min(0, 'Computer fee must be 0 or more'),
  functionFee: yup
    .number()
    .typeError('Function fee must be a number')
    .min(0, 'Function fee must be 0 or more'),
  smartClassFee: yup
    .number()
    .typeError('Smart class fee must be a number')
    .min(0, 'Smart class fee must be 0 or more'),
  otherCharges: yup
    .number()
    .typeError('Other charges must be a number')
    .min(0, 'Other charges must be 0 or more'),
});

const empty: FormState = { className: '', admissionFee: '', monthlyFee: '', examFee: '', sportFee: '', computerFee: '', functionFee: '', smartClassFee: '', otherCharges: '' };

export function FeeStructureModal({
  open,
  onClose,
  editing,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: FeeStructureRecord | null;
  onSubmit: (payload: FeeStructurePayload) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    setForm(editing ? {
      className: editing.className,
      admissionFee: String(editing.admissionFee),
      monthlyFee: String(editing.monthlyFee),
      examFee: String(editing.examFee),
      sportFee: String(editing.sportFee),
      computerFee: String(editing.computerFee),
      functionFee: String(editing.functionFee),
      smartClassFee: String(editing.smartClassFee),
      otherCharges: String(editing.otherCharges),
    } : empty);
    setErrors({});
  }, [editing, open]);

  const set = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    try {
      const valid = await schema.validate(form, { abortEarly: false });
      setErrors({});
      await onSubmit({
        className: valid.className,
        admissionFee: Number(valid.admissionFee),
        monthlyFee: Number(valid.monthlyFee),
        examFee: Number(valid.examFee),
        sportFee: Number(valid.sportFee),
        computerFee: Number(valid.computerFee),
        functionFee: Number(valid.functionFee),
        smartClassFee: Number(valid.smartClassFee),
        otherCharges: Number(valid.otherCharges),
      });
    } catch (error: any) {
      if (error?.inner) {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        for (const item of error.inner) {
          if (item.path) nextErrors[item.path as keyof FormState] = item.message;
        }
        setErrors(nextErrors);
      }
      return;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Fee Structure' : 'Add Fee Structure'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>{editing ? 'Save Changes' : 'Create Structure'}</Button></>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Class" required>
          <select
            value={form.className}
            onChange={(e) => set('className', e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Select class</option>
            {CLASS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {errors.className ? <p className="mt-1 text-xs text-rose-500">{errors.className}</p> : null}
        </Field>
        <Field label="Monthly Fee" required>
          <Input type="text" value={form.monthlyFee} onChange={(e) => set('monthlyFee', e.target.value)} />
          {errors.monthlyFee ? <p className="mt-1 text-xs text-rose-500">{errors.monthlyFee}</p> : null}
        </Field>
        <Field label="Admission Fee">{/* text input by request */}<Input type="text" value={form.admissionFee} onChange={(e) => set('admissionFee', e.target.value)} />{errors.admissionFee ? <p className="mt-1 text-xs text-rose-500">{errors.admissionFee}</p> : null}</Field>
        <Field label="Exam Fee"><Input type="text" value={form.examFee} onChange={(e) => set('examFee', e.target.value)} />{errors.examFee ? <p className="mt-1 text-xs text-rose-500">{errors.examFee}</p> : null}</Field>
        <Field label="Sport Fee"><Input type="text" value={form.sportFee} onChange={(e) => set('sportFee', e.target.value)} />{errors.sportFee ? <p className="mt-1 text-xs text-rose-500">{errors.sportFee}</p> : null}</Field>
        <Field label="Computer Fee"><Input type="text" value={form.computerFee} onChange={(e) => set('computerFee', e.target.value)} />{errors.computerFee ? <p className="mt-1 text-xs text-rose-500">{errors.computerFee}</p> : null}</Field>
        <Field label="Function Fee"><Input type="text" value={form.functionFee} onChange={(e) => set('functionFee', e.target.value)} />{errors.functionFee ? <p className="mt-1 text-xs text-rose-500">{errors.functionFee}</p> : null}</Field>
        <Field label="Smart Class Fee"><Input type="text" value={form.smartClassFee} onChange={(e) => set('smartClassFee', e.target.value)} />{errors.smartClassFee ? <p className="mt-1 text-xs text-rose-500">{errors.smartClassFee}</p> : null}</Field>
        <Field label="Other Charges"><Input type="text" value={form.otherCharges} onChange={(e) => set('otherCharges', e.target.value)} />{errors.otherCharges ? <p className="mt-1 text-xs text-rose-500">{errors.otherCharges}</p> : null}</Field>
      </div>
    </Modal>
  );
}
