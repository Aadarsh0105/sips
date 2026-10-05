import { Modal } from "../ui/Modal";
import { Link } from "react-router-dom";

export function PaymentPolicyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Payment Policy" size="md">
      <div className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <p>
          This portal lets verified students or parents view fee details and generate an online QR payment. Payments are processed by the payment provider.
        </p>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Failed or pending payments</p>
          <p>A fee is treated as paid only after the QR status is confirmed successful. If your account is debited but the status remains pending or fails, contact the school office with your QR or transaction reference.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Payment amount and fee selection</p>
          <p>Review the selected fee heads, payable months, and amount before generating a QR code. The QR code is created for the exact amount shown in the portal.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Regular and lump-sum payments</p>
          <p>Regular payments apply to the fee heads and due months selected. Lump-sum payments use the available lump-sum preview and must be paid together.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Payment confirmation</p>
          <p>Keep the QR window open while payment is being verified. The portal checks the payment status automatically and refreshes the fee balance after confirmation.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Privacy and verification</p>
          <p>Student details are shown only after search OTP verification. Use only your registered student ID or mobile number and do not share OTPs or payment references with others.</p>
        </div>
        <p className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
          Please keep your transaction reference and payment receipt until the payment is completed and reflected in your fee details.
        </p>
        <Link to="/policies" className="inline-block text-sm font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300">
          Read complete Terms & Conditions and Privacy Policy
        </Link>
      </div>
    </Modal>
  );
}
