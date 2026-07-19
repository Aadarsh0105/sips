




import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { useData } from '../../contexts/DataContext';
import type { Gender, Student } from '../../lib/types';
import { SESSION } from '../../lib/seed';

const CLASSES = ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const SECTIONS = ['A', 'B', 'C', 'D'];

type FormState = Omit<Student, 'id' | 'admissionNumber' | 'createdAt'> & {admissionNumber?: string;};

const empty: FormState = {
  name: '',
  fatherName: '',
  motherName: '',
  className: 'I',
  section: 'A',
  rollNumber: '',
  gender: 'male',
  dob: '',
  mobile: '',
  parentMobile: '',
  address: '',
  email: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  session: SESSION,
  totalFee: 0,
  discount: 0,
  fine: 0,
  dueDate: '',
  admissionNumber: '',
  photo: ''
};

export function StudentFormModal({
  open,
  onClose,
  editing




}: {open: boolean;onClose: () => void;editing?: Student | null;}) {
  const { addStudent, updateStudent } = useData();
  const [form, setForm] = useState<FormState>(empty);

  useEffect(() => {
    if (editing) {
      const { id, createdAt, ...rest } = editing;
      setForm({ ...rest });
    } else {
      setForm(empty);
    }
  }, [editing, open]);

  const set = <K extends keyof FormState,>(key: K, value: FormState[K]) =>
  setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.name.trim()) return toast.error('Student name is required.');
    if (!form.mobile.trim() && !form.parentMobile.trim())
    return toast.error('At least one contact number is required.');
    if (form.totalFee < 0) return toast.error('Total fee cannot be negative.');

    if (editing) {
      updateStudent(editing.id, form);
      toast.success('Student updated successfully.');
    } else {
      const s = addStudent(form);
      toast.success(`Student added — ID ${s.id}`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editing ? 'Edit Student' : 'Add Student'}
      subtitle={editing ? editing.id : 'Student ID and admission number are generated automatically'}
      footer={
      <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{editing ? 'Save Changes' : 'Add Student'}</Button>
        </>
      }>
      
      <div className="space-y-6">
        <Section title="Personal Information">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
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
          <Field label="Profile Photo URL (optional)">
            <Input value={form.photo} onChange={(e) => set('photo', e.target.value)} />
          </Field>
        </Section>

        <Section title="Academic Details">
          {editing &&
          <Field label="Admission Number">
              <Input
              value={form.admissionNumber}
              onChange={(e) => set('admissionNumber', e.target.value)} />
            
            </Field>
          }
          <Field label="Class">
            <Select value={form.className} onChange={(e) => set('className', e.target.value)}>
              {CLASSES.map((c) =>
              <option key={c} value={c}>
                  {c}
                </option>
              )}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={form.section} onChange={(e) => set('section', e.target.value)}>
              {SECTIONS.map((s) =>
              <option key={s} value={s}>
                  {s}
                </option>
              )}
            </Select>
          </Field>
          <Field label="Roll Number">
            <Input value={form.rollNumber} onChange={(e) => set('rollNumber', e.target.value)} />
          </Field>
          <Field label="Academic Session">
            <Input value={form.session} onChange={(e) => set('session', e.target.value)} />
          </Field>
          <Field label="Admission Date">
            <Input
              type="date"
              value={form.admissionDate}
              onChange={(e) => set('admissionDate', e.target.value)} />
            
          </Field>
        </Section>

        <Section title="Contact">
          <Field label="Student Mobile">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label="Parent Mobile">
            <Input value={form.parentMobile} onChange={(e) => set('parentMobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Address" className="sm:col-span-3">
            <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </Section>

        <Section title="Fee Structure">
          <Field label="Total Fee (₹)">
            <Input
              type="number"
              value={form.totalFee}
              onChange={(e) => set('totalFee', Number(e.target.value))} />
            
          </Field>
          <Field label="Discount (₹)">
            <Input
              type="number"
              value={form.discount}
              onChange={(e) => set('discount', Number(e.target.value))} />
            
          </Field>
          <Field label="Fine (₹)">
            <Input
              type="number"
              value={form.fine}
              onChange={(e) => set('fine', Number(e.target.value))} />
            
          </Field>
          <Field label="Due Date">
            <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
        </Section>
      </div>
    </Modal>);

}

function Section({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</div>
    </div>);

}