import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Activity,
  BedDouble,
  FlaskConical,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AuditLog,
  Bed,
  Invoice,
  InvoiceItem,
  LabOrder,
  Patient,
} from '../../types/erp.ts';

interface AdminAndBillingPortalProps {
  beds: Bed[];
  labOrders: LabOrder[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  patients: Patient[];
  auditLogs: AuditLog[];
  onRefresh: () => Promise<void>;
}

const RBAC_MATRIX = [
  {
    role: 'Super Admin',
    appointments: 'Read / Manage',
    emr: 'Audit Only',
    rx: 'None',
    lab: 'Audit Only',
    billing: 'Full Access',
    config: 'Full Access',
  },
  {
    role: 'Doctor',
    appointments: 'View Own / Edit',
    emr: 'Full Access',
    rx: 'Create / Sign',
    lab: 'Review / Sign',
    billing: 'Read Own Fees',
    config: 'None',
  },
  {
    role: 'Nurse',
    appointments: 'View Department',
    emr: 'Vitals Entry / Read',
    rx: 'Read Only',
    lab: 'View Reports',
    billing: 'None',
    config: 'None',
  },
  {
    role: 'Lab Technician',
    appointments: 'View Diagnostic',
    emr: 'Test Order Access',
    rx: 'None',
    lab: 'Enter / Validate',
    billing: 'None',
    config: 'None',
  },
  {
    role: 'Pharmacist',
    appointments: 'None',
    emr: 'Prescription Read',
    rx: 'Dispense Only',
    lab: 'None',
    billing: 'POS Terminal',
    config: 'Inventory Only',
  },
  {
    role: 'Cashier',
    appointments: 'Read / Confirm',
    emr: 'None',
    rx: 'Billing Items',
    lab: 'Billing Items',
    billing: 'Process / Refund',
    config: 'None',
  },
  {
    role: 'Patient',
    appointments: 'Book / Reschedule',
    emr: 'Own History Only',
    rx: 'Own Active',
    lab: 'Own Finalized',
    billing: 'Own Invoices',
    config: 'Profile Only',
  },
];

export const AdminAndBillingPortal: React.FC<AdminAndBillingPortalProps> = ({
  beds,
  labOrders,
  invoices,
  invoiceItems,
  patients,
  auditLogs,
  onRefresh,
}) => {
  const [selectedInvoiceId] = useState<string>(
    invoices[0]?.id || ''
  );
  const activeInvoice =
    invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
  const activePatient =
    patients.find((p) => p.id === activeInvoice?.patientId) || patients[0];
  const activeItems = invoiceItems.filter(
    (item) => item.invoiceId === activeInvoice?.id
  );

  const remainingBalance = activeInvoice
    ? Math.max(0, Number(activeInvoice.netAmount) - Number(activeInvoice.paidAmount))
    : 0;

  const [paymentAmount, setPaymentAmount] = useState<number>(remainingBalance || 800000);
  const [paymentMethod, setPaymentMethod] = useState<string>('SPLIT_TPA');
  const [insuranceProvider, setInsuranceProvider] = useState<string>(
    activeInvoice?.insuranceProvider || 'Allianz Health Corporate TPA'
  );
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;
  const totalBeds = beds.length || 1;
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);
  const pendingLabs = labOrders.filter((l) => l.orderStatus !== 'VERIFIED').length;

  const handleSettleInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setProcessingPayment(true);
    try {
      const res = await fetch(`/api/invoices/${activeInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentAmount,
          paymentMethod,
          insuranceProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process payment');
      await onRefresh();
      setPaymentSuccessMsg(
        `Payment of IDR ${paymentAmount.toLocaleString('en-US')} for ${
          activeInvoice.invoiceNumber
        } recorded. Invoice Status: ${data.status}.`
      );
    } catch (err: any) {
      setPaymentSuccessMsg(err.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Live Operations Command Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Inpatient Bed Occupancy (Occupied / Total Beds)
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1 block">
              {occupiedBeds} / {totalBeds} Beds ({occupancyPct}%)
            </span>
            <span className="text-xs text-blue-600 font-semibold mt-1 block">
              ICU & Executive VIP Pavilion Active
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <BedDouble className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Lab Orders Pending Pathologist Verification
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1 block">
              {pendingLabs} Specimens
            </span>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
              SLA Turnaround &lt; 4 Hours
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <FlaskConical className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              24/7 Emergency ER Triage Status
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1 block">
              Code Green · 4 Min
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Average Attending Physician Response Time
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {paymentSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {paymentSuccessMsg}
          </span>
          <button onClick={() => setPaymentSuccessMsg(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Unified Billing Engine & Cashier Split Settlement Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Unified Billing Ledger — Itemized Statement</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated aggregation of Specialist Consultation, Lab Diagnostics, and eRx Medications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF Receipt</span>
            </button>
          </div>

          {activeInvoice && (
            <>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Invoice Number</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                    {activeInvoice.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Patient & UHID</span>
                  <span className="font-bold text-slate-900">
                    {activePatient?.fullName} ({activePatient?.uhid})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Settlement Status</span>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      activeInvoice.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {activeInvoice.status}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Service / Procedure Description</th>
                      <th className="py-2.5 text-right">Qty</th>
                      <th className="py-2.5 text-right">Subtotal (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {activeItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-bold text-blue-600">{item.itemType}</td>
                        <td className="py-3 font-sans font-medium text-slate-900">
                          {item.description}
                        </td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {Number(item.subtotal).toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Total:</span>
                  <span>IDR {Number(activeInvoice.totalAmount).toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Corporate Discount / Subsidy:</span>
                  <span>- IDR {Number(activeInvoice.discountAmount).toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                  <span>Net Payable Amount:</span>
                  <span>IDR {Number(activeInvoice.netAmount).toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid Amount:</span>
                  <span>IDR {Number(activeInvoice.paidAmount).toLocaleString('en-US')}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-extrabold pt-1 border-t border-slate-100">
                  <span>Outstanding Balance:</span>
                  <span>IDR {remainingBalance.toLocaleString('en-US')}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Cashier Split Settlement Terminal */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Cashier Settlement & TPA Insurance Claims</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Process cash, credit/debit card, or split insurance TPA copay settlements.
            </p>
          </div>

          <form onSubmit={handleSettleInvoice} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="SPLIT_TPA">Split Payment: TPA Insurance + Patient Copay</option>
                <option value="CREDIT_CARD">Credit / Debit Card Terminal</option>
                <option value="QRIS_VA">Hospital Virtual Account / Instant QR</option>
                <option value="CASH">Cash Settlement (Cashier Desk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Insurance Payer / TPA Provider
              </label>
              <input
                type="text"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Settlement Amount (IDR)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-extrabold font-mono tabular-nums text-blue-600"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(remainingBalance)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  Pay Full Balance (IDR {remainingBalance.toLocaleString('en-US')})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(Math.round(remainingBalance / 2))}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  Split 50% Copay
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={processingPayment || remainingBalance === 0}
              className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white text-xs font-bold transition-colors"
            >
              {remainingBalance === 0
                ? '✓ Invoice Settled in Full (PAID)'
                : processingPayment
                ? 'Processing Settlement...'
                : 'Confirm Settlement & Print Receipt'}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Role-Based Access Control (RBAC) Matrix from Blueprint Section 7 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Role-Based Access Control Matrix (RBAC Engine Blueprint)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Field-level authorization enforcement aligned with HIPAA medical record security standards.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2.5">Role</th>
                <th className="py-2.5">Appointments</th>
                <th className="py-2.5">Patient EMR</th>
                <th className="py-2.5">Prescriptions</th>
                <th className="py-2.5">Lab Results</th>
                <th className="py-2.5">Billing & Cash</th>
                <th className="py-2.5">Admin / Config</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RBAC_MATRIX.map((row) => (
                <tr key={row.role}>
                  <td className="py-2.5 font-bold text-slate-900">{row.role}</td>
                  <td className="py-2.5 text-slate-700">{row.appointments}</td>
                  <td className="py-2.5 text-slate-700">{row.emr}</td>
                  <td className="py-2.5 text-slate-700">{row.rx}</td>
                  <td className="py-2.5 text-slate-700">{row.lab}</td>
                  <td className="py-2.5 text-slate-700">{row.billing}</td>
                  <td className="py-2.5 text-slate-700">{row.config}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Real-Time Cloud SQL Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          Security Audit Logs & Clinical Transaction Trail (PostgreSQL audit_logs)
        </h2>
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-mono font-bold text-blue-600">{log.action}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span className="font-semibold text-slate-800">Role: {log.actorRole}</span>
                <p className="text-slate-600 mt-0.5">{log.details}</p>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                {new Date(log.createdAt).toLocaleString('en-US')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
