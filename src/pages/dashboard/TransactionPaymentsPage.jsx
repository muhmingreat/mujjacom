
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  ExternalLink
} from "lucide-react";

import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const initialForm = {
  amount: "",
  paymentType: "deposit",
  paymentMethod: "bank_transfer",
  paymentReference: "",
  note: ""
};

const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EVIDENCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

function formatAmount(amount, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(Number(amount || 0));
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getStatusStyle(status) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    verified: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  return styles[status] || "bg-gray-100 text-gray-700";
}

function getPaymentIcon(status) {
  if (status === "verified") return CheckCircle2;
  if (status === "rejected") return XCircle;
  return Clock;
}

export default function TransactionPaymentsPage() {
  const params = useParams();
  const transactionId = params.id || params.transactionId;

  const { token, user } = useAuth();

  const fileInputRef = useRef(null);

  const [transaction, setTransaction] = useState(null);

  const [paymentData, setPaymentData] = useState({
    payments: [],
    verifiedAmount: 0,
    outstandingBalance: 0,
    agreedAmount: 0,
    currency: "NGN"
  });

  const [form, setForm] = useState(initialForm);
  const [evidenceFile, setEvidenceFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadPayments = useCallback(async () => {
    if (!transactionId || !token) {
      setError("Transaction information is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [transactionResult, paymentResult] = await Promise.all([
        api.getMyTransaction(transactionId, token),
        api.getMyTransactionPayments(transactionId, token)
      ]);

      const transactionRecord =
        transactionResult?.data?.data ??
        transactionResult?.data?.transaction ??
        transactionResult?.transaction ??
        transactionResult?.data ??
        transactionResult;

      const paymentRecord =
        paymentResult?.data?.data ??
        paymentResult?.data ??
        paymentResult;

      setTransaction(transactionRecord);

      setPaymentData({
        payments: paymentRecord?.payments || [],
        verifiedAmount: paymentRecord?.verifiedAmount || 0,
        outstandingBalance: paymentRecord?.outstandingBalance || 0,
        agreedAmount:
          paymentRecord?.agreedAmount ??
          transactionRecord?.agreedAmount ??
          0,
        currency:
          paymentRecord?.currency ??
          transactionRecord?.currency ??
          "NGN"
      });
    } catch (err) {
      setError(err.message || "Unable to load transaction payments.");
    } finally {
      setLoading(false);
    }
  }, [transactionId, token]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const buyerId =
    transaction?.buyer?._id ||
    transaction?.buyer?.id ||
    transaction?.buyer;

  const currentUserId = user?.id || user?._id;

  const isBuyer =
    String(buyerId || "") === String(currentUserId || "");

  const canSubmitPayment =
    isBuyer &&
    ["payment_pending", "in_progress"].includes(transaction?.status) &&
    paymentData.outstandingBalance > 0;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0] || null;

    setError("");
    setEvidenceFile(null);

    if (!file) return;

    if (!ALLOWED_EVIDENCE_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, WebP and PDF files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_EVIDENCE_SIZE) {
      setError("Payment evidence must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setEvidenceFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    if (amount > paymentData.outstandingBalance) {
      setError("Payment amount cannot exceed the outstanding balance.");
      return;
    }

    if (
      evidenceFile &&
      !ALLOWED_EVIDENCE_TYPES.includes(evidenceFile.type)
    ) {
      setError("The selected evidence file type is not supported.");
      return;
    }

    if (evidenceFile && evidenceFile.size > MAX_EVIDENCE_SIZE) {
      setError("Payment evidence must not exceed 5 MB.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("amount", String(amount));
      formData.append("paymentType", form.paymentType);
      formData.append("paymentMethod", form.paymentMethod);
      formData.append("paymentReference", form.paymentReference);
      formData.append("note", form.note);

      if (evidenceFile) {
        formData.append("evidence", evidenceFile);
      }

      await api.submitTransactionPayment(
        transactionId,
        formData,
        token
      );

      setForm(initialForm);
      setEvidenceFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccessMessage(
        "Payment record submitted successfully. It is awaiting admin review."
      );

      await loadPayments();
    } catch (err) {
      setError(err.message || "Unable to submit payment record.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading payment records...
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  if (!transaction) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard/transactions"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to transactions
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Transaction Payments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Reference: {transaction.transactionReference}
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Agreed amount</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {formatAmount(paymentData.agreedAmount, paymentData.currency)}
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm text-green-700">Verified payments</p>
          <p className="mt-2 text-xl font-bold text-green-800">
            {formatAmount(paymentData.verifiedAmount, paymentData.currency)}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm text-blue-700">Outstanding balance</p>
          <p className="mt-2 text-xl font-bold text-blue-900">
            {formatAmount(
              paymentData.outstandingBalance,
              paymentData.currency
            )}
          </p>
        </div>
      </div>

      {canSubmitPayment && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 text-green-700">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Submit a payment record
              </h2>
              <p className="text-sm text-gray-500">
                Submit your payment details for administrative verification.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  max={paymentData.outstandingBalance}
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Payment type
                </label>

                <select
                  name="paymentType"
                  value={form.paymentType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                >
                  <option value="deposit">Deposit</option>
                  <option value="installment">Instalment</option>
                  <option value="balance">Final balance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Payment method
                </label>

                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                >
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Payment reference
                </label>

                <input
                  type="text"
                  name="paymentReference"
                  maxLength={150}
                  value={form.paymentReference}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                  placeholder="Optional reference"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Payment evidence
              </label>

              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5">
                <div className="flex flex-col items-center text-center">
                  <Upload className="mb-3 h-8 w-8 text-green-700" />

                  <p className="text-sm font-semibold text-gray-800">
                    Upload payment evidence
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    JPEG, PNG, WebP or PDF · Maximum 5 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleEvidenceChange}
                    className="mt-4 block w-full max-w-sm text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-green-800"
                  />

                  {evidenceFile && (
                    <div className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-left text-sm text-green-800">
                      <p className="font-semibold">
                        {evidenceFile.name}
                      </p>
                      <p className="text-xs">
                        {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Evidence is optional. Only upload documents relevant to this
                transaction. Avoid including unrelated personal or banking
                information.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Additional note
              </label>

              <textarea
                name="note"
                rows={3}
                maxLength={2000}
                value={form.note}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                placeholder="Add any relevant payment information"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || paymentData.outstandingBalance <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}

              {submitting ? "Submitting..." : "Submit payment record"}
            </button>
          </form>
        </section>
      )}

      {!canSubmitPayment && isBuyer && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {paymentData.outstandingBalance <= 0
            ? "There is no outstanding balance remaining for this transaction."
            : `Payment submission is not currently available for this transaction status: ${transaction.status?.replaceAll("_", " ")}.`}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <FileText className="h-5 w-5 text-green-700" />

          <h2 className="text-lg font-bold text-gray-900">
            Payment history
          </h2>
        </div>

        {paymentData.payments.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <CreditCard className="mx-auto mb-3 h-8 w-8 text-gray-400" />

            <p className="font-medium text-gray-700">
              No payment records yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Payment submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentData.payments.map((payment) => {
              const StatusIcon = getPaymentIcon(payment.status);

              return (
                <div
                  key={payment._id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>

                      <p className="mt-1 text-sm capitalize text-gray-500">
                        {payment.paymentType} ·{" "}
                        {payment.paymentMethod?.replaceAll("_", " ")}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(payment.status)}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {payment.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-gray-500">Submitted</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(payment.submittedAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Payment reference</p>
                      <p className="font-medium text-gray-800">
                        {payment.paymentReference || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {payment.evidenceUrl && (
                    <a
                      href={payment.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                    >
                      View payment evidence
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  {payment.reviewNote && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                      <p className="font-semibold text-gray-700">
                        Admin review note
                      </p>

                      <p className="mt-1 text-gray-600">
                        {payment.reviewNote}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


