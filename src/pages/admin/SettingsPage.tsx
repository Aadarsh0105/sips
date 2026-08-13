import { useState } from 'react';
import { CalendarOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Input';
import { SchoolLogo } from '../../components/shared/SchoolLogo';
import { QRCode } from '../../components/shared/QRCode';
import { CommonConfirmModal } from '../../components/ui/CommonConfirmModal';
import { useData } from '../../contexts/DataContext';

export function SettingsPage() {
  const { settings } = useData();
  const [waiveOpen, setWaiveOpen] = useState(false);
  const [waiving, setWaiving] = useState(false);

  const waiveSummerFees = async () => {
    try {
      setWaiving(true);
      await api.post(`${API.FEES}/monthly-fee/waive`, {
        academicYear: settings.session,
        months: ['MAY', 'JUNE'],
        reason: 'Summer vacation',
      });
      toast.success('May and June monthly and bus fees waived successfully.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to waive May and June fees.');
    } finally {
      setWaiving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="School Settings"
        subtitle="View your school profile, payment details, and invoice settings."
        action={
          <Button onClick={() => setWaiveOpen(true)}>
            <CalendarOffIcon className="h-4 w-4" /> Waive May &amp; June Fees
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="School Profile" />
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="School Name" className="sm:col-span-2"><Input value={settings.name} disabled /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea value={settings.address} disabled /></Field>
              <Field label="Contact Number"><Input value={settings.contact} disabled /></Field>
              <Field label="Email"><Input type="email" value={settings.email} disabled /></Field>
              <Field label="Academic Session"><Input value={settings.session} disabled /></Field>
              {/* <Field label="School Logo URL"><Input value={settings.logo} disabled /></Field> */}
            </div>
          </Card>

          {/* <Card>
            <CardHeader title="Payment Details" subtitle="UPI configuration for QR payments" />
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="UPI ID"><Input value={settings.upiId} disabled /></Field>
              <Field label="QR Code Image URL"><Input value={settings.qrImage} disabled /></Field>
            </div>
          </Card> */}

          {/* <Card>
            <CardHeader title="Invoice" />
            <div className="px-5 pb-5">
              <Field label="Invoice Footer Text"><Textarea value={settings.invoiceFooter} disabled /></Field>
            </div>
          </Card> */}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Preview" />
            <div className="flex flex-col items-center gap-3 px-5 pb-6 text-center">
              <SchoolLogo logo={settings.logo} name={settings.name} size="lg" />
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{settings.name}</p>
              <p className="text-sm text-slate-500">{settings.address}</p>
              <p className="text-sm text-slate-500">{settings.contact} · {settings.email}</p>
              <p className="text-xs text-slate-400">Session {settings.session}</p>
            </div>
          </Card>
          {/* <Card>
            <CardHeader title="UPI QR Preview" />
            <div className="flex flex-col items-center gap-2 px-5 pb-6">
              {settings.qrImage ? (
                <img src={settings.qrImage} alt="QR" className="h-44 w-44 rounded-lg object-contain" />
              ) : (
                <QRCode value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.name)}`} size={176} />
              )}
              <p className="text-sm font-semibold text-brand-600">{settings.upiId || 'upi@id'}</p>
            </div>
          </Card>*/}
        </div>
      </div>

      <CommonConfirmModal
        open={waiveOpen}
        onClose={() => setWaiveOpen(false)}
        onConfirm={() => void waiveSummerFees()}
        title="Waive May and June fees?"
        message={`Are you sure you want to waive monthly and bus fees for May and June in academic year ${settings.session}?`}
        confirmLabel={waiving ? 'Waiving...' : 'Confirm Waiver'}
        tone="primary"
      />
    </div>
  );
}
