import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createStudent, fetchStudents, updateStudent, type StudentRecord } from '../../features/students/studentsSlice';
import type { Gender } from '../../lib/types';

const CLASSES = ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const SECTIONS = ['A', 'B', 'C', 'D'];

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
  monthlyFee: number;
  openingDue: number;
  totalFee: number;
};

const empty: FormState = {
  admissionNo: '',
  name: '',
  fatherName: '',
  motherName: '',
  mobile: '',
  email: '',
  gender: 'MALE',
  dob: '',
  className: 'I',
  section: 'A',
  address: '',
  admissionDate: '',
  monthlyFee: 0,
  openingDue: 0,
  totalFee: 0,
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

  useEffect(() => {
    if (editing) {
      setForm({
        admissionNo: editing.admissionNo,
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
        monthlyFee: editing.monthlyFee ?? 0,
        openingDue: editing.openingDue ?? 0,
        totalFee: editing.totalFee,
      });
    } else {
      setForm(empty);
    }
  }, [editing, open]);

  const set = <K extends keyof FormState,>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.name.trim()) return toast.error('Student name is required.');
    if (!form.mobile.trim()) return toast.error('Student mobile is required.');
    if (form.monthlyFee < 0) return toast.error('Monthly fee cannot be negative.');
    if (form.totalFee < 0) return toast.error('Total fee cannot be negative.');

    if (editing) {
      void dispatch(updateStudent({ id: editing._id, payload: form as any })).then(() => dispatch(fetchStudents()));
      toast.success('Student updated successfully.');
    } else {
      void dispatch(createStudent(form as any)).then(() => dispatch(fetchStudents()));
      toast.success('Student added successfully.');
    }
    onClose();
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{editing ? 'Save Changes' : 'Add Student'}</Button>
        </>
      }
    >
      <div className="space-y-6">
        <Section title="Personal Information">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Date of Birth">
            <Input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
          </Field>
          <Field label="Father's Name">
            <Input value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)} />
          </Field>
          <Field label="Mother's Name">
            <Input value={form.motherName} onChange={(e) => set('motherName', e.target.value)} />
          </Field>
        </Section>

        <Section title="Academic Details">
          <Field label="Admission No">
            <Input value={form.admissionNo} onChange={(e) => set('admissionNo', e.target.value)} />
          </Field>
          <Field label="Admission Date">
            <Input type="date" value={form.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} />
          </Field>
          <Field label="Class">
            <Select value={form.className} onChange={(e) => set('className', e.target.value)}>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={form.section} onChange={(e) => set('section', e.target.value)}>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Student ID">
            <Input value={editing?.studentId ?? 'Auto generated'} disabled />
          </Field>
        </Section>

        <Section title="Contact">
          <Field label="Student Mobile">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Address" className="sm:col-span-3">
            <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </Section>

        <Section title="Fee Structure">
          <Field label="Monthly Fee (?)">
            <Input type="number" value={form.monthlyFee} onChange={(e) => set('monthlyFee', Number(e.target.value))} />
          </Field>
          <Field label="Opening Due (?)">
            <Input type="number" value={form.openingDue} onChange={(e) => set('openingDue', Number(e.target.value))} />
          </Field>
          <Field label="Total Fee (?)">
            <Input
              type="number"
              value={form.totalFee}
              onChange={(e) => set('totalFee', Number(e.target.value))}
            />
          </Field>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}
