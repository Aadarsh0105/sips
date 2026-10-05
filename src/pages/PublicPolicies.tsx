import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { SchoolLogo } from "../components/shared/SchoolLogo";
import { useData } from "../contexts/DataContext";

export function PublicPolicies() {
  const { settings } = useData();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-700 dark:bg-slate-950 dark:text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
          <ArrowLeftIcon className="h-4 w-4" /> Back to student portal
        </Link>
        <header className="mt-6 rounded-2xl bg-brand-700 p-6 text-white shadow-soft sm:p-8">
          <div className="flex items-center gap-3">
            <SchoolLogo logo={settings.logo} name={settings.name} size="sm" className="ring-2 ring-white/30" />
            <div>
              <p className="font-display text-lg font-bold">{settings.name}</p>
              <p className="text-sm text-white/75">Student Fee Portal</p>
            </div>
          </div>
          <h1 className="mt-8 font-display text-3xl font-bold">Terms & Conditions and Privacy Policy</h1>
          <p className="mt-2 text-sm text-white/80">Information about using the student fee search and online payment services.</p>
        </header>

        <article className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">1. Using the student portal</h2>
            <p className="mt-2 leading-7">The portal allows verified students or parents to view student fee information, select eligible fees or due months, generate an online QR payment, and view payment status.</p>
            <p className="mt-2 leading-7">Use only the registered student ID or mobile number. You are responsible for ensuring that the student information and payment details selected before checkout are correct.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">2. Online payments</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-7">
              <li>Payments are processed through the payment provider linked from the generated QR code.</li>
              <li>The QR code is generated for the exact amount and fee selection shown in the portal.</li>
              <li>Regular payments apply to the selected fee heads and payable months.</li>
              <li>Lump-sum payments use the available preview and must be paid together.</li>
              <li>A payment is reflected in fee details only after the payment status is confirmed successful.</li>
              <li>Payment-provider terms, availability, and processing times may also apply.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">3. Failed or pending payments</h2>
            <p className="mt-2 leading-7">A pending or failed status does not confirm payment of the fee. If your account is debited while the portal shows a pending or failed status, contact the school office with the QR ID, transaction reference, amount, and date so the payment can be checked.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">4. OTP and account security</h2>
            <p className="mt-2 leading-7">Student details are released only after the required search OTP verification. Keep OTPs, QR IDs, transaction references, and payment links private. The school will not ask you to share an OTP with another person.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">5. Privacy policy</h2>
            <p className="mt-2 leading-7">The portal may display and process student information such as name, student ID, class, contact details, fee details, payment status, and transaction references to provide student search and fee payment services.</p>
            <p className="mt-2 leading-7">Payment details are handled through authorised payment providers. The portal uses payment status and reference information to verify transactions, update fee details, and support payment enquiries. Complete card or banking credentials are not requested in the student portal.</p>
            <p className="mt-2 leading-7">Information may be retained as needed for fee records, payment reconciliation, security, support, and applicable school or legal requirements. Access is limited to authorised use of the school system.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">6. Third-party payment services</h2>
            <p className="mt-2 leading-7">When you open the payment provider page or scan the QR code, that provider’s terms, privacy policy, and security practices apply to the payment experience. Review the provider’s information before completing payment.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">7. Policy updates and support</h2>
            <p className="mt-2 leading-7">These policies may be updated when the portal, payment process, or applicable requirements change. For questions about student records or a payment, contact the school office using the contact details shown on the student portal.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
