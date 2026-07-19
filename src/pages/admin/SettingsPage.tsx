














import React, { useState } from 'react';
import { SaveIcon, RotateCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Input';
import { SchoolLogo } from '../../components/shared/SchoolLogo';
import { QRCode } from '../../components/shared/QRCode';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useData } from '../../contexts/DataContext';
import { store } from '../../lib/storage';
import type { SchoolSettings } from '../../lib/types';

export function SettingsPage() {
  const { settings, updateSettings } = useData();
  const [form, setForm] = useState<SchoolSettings>(settings);
  const [resetOpen, setResetOpen] = useState(false);

  const set = <K extends keyof SchoolSettings,>(k: K, v: SchoolSettings[K]) =>
  setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return toast.error('School name is required.');
    updateSettings(form);
    toast.success('School settings saved.');
  };

  return (
    <div>
      <PageHeader
        title="School Settings"
        subtitle="Manage your school profile, payment details, and invoices."
        action={
        <>
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              <RotateCcwIcon className="h-4 w-4" /> Reset Demo Data
            </Button>
            <Button onClick={save}>
              <SaveIcon className="h-4 w-4" /> Save Changes
            </Button>
          </>
        } />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="School Profile" />
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="School Name" required className="sm:col-span-2">
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} />
              </Field>
              <Field label="Contact Number">
                <Input value={form.contact} onChange={(e) => set('contact', e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Academic Session">
                <Input value={form.session} onChange={(e) => set('session', e.target.value)} />
              </Field>
              <Field label="School Logo URL">
                <Input value={form.logo} onChange={(e) => set('logo', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment Details" subtitle="UPI configuration for QR payments" />
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="UPI ID">
                <Input value={form.upiId} onChange={(e) => set('upiId', e.target.value)} />
              </Field>
              <Field label="QR Code Image URL (optional)">
                <Input value={form.qrImage} onChange={(e) => set('qrImage', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Invoice" />
            <div className="px-5 pb-5">
              <Field label="Invoice Footer Text">
                <Textarea
                  value={form.invoiceFooter}
                  onChange={(e) => set('invoiceFooter', e.target.value)} />
                
              </Field>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Preview" />
            <div className="flex flex-col items-center gap-3 px-5 pb-6 text-center">
              <SchoolLogo logo={form.logo} name={form.name} size="lg" />
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {form.name || 'School Name'}
              </p>
              <p className="text-sm text-slate-500">{form.address}</p>
              <p className="text-sm text-slate-500">
                {form.contact} · {form.email}
              </p>
              <p className="text-xs text-slate-400">Session {form.session}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="UPI QR Preview" />
            <div className="flex flex-col items-center gap-2 px-5 pb-6">
              {form.qrImage ?
              <img src={form.qrImage} alt="QR" className="h-44 w-44 rounded-lg object-contain" /> :

              <QRCode value={`upi://pay?pa=${form.upiId}&pn=${encodeURIComponent(form.name)}`} size={176} />
              }
              <p className="text-sm font-semibold text-brand-600">{form.upiId || 'upi@id'}</p>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          store.reset();
          toast.success('Demo data reset. Reloading…');
          setTimeout(() => window.location.reload(), 600);
        }}
        title="Reset all demo data?"
        message="This restores students, payments, and staff to the original seed data. Your session stays active."
        confirmLabel="Reset Data" />
      
    </div>);

}