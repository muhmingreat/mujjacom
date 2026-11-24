
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Search,
  RefreshCw,
  Plus,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Building2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";

const STATUS_TRANSITIONS = {
  initiated: ["terms_pending", "cancelled", "disputed"],
  terms_pending: ["agreement_pending", "cancelled", "disputed"],
  agreement_pending: [
    "payment_pending",
    "in_progress",
    "cancelled",
    "disputed",
  ],
  payment_pending: ["in_progress", "cancelled", "disputed"],
  in_progress: ["completed", "disputed", "cancelled"],
  disputed: ["in_progress", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const STATUS_STYLES = {
  initiated: "bg-blue-50 text-blue-700",
  terms_pending: "bg-amber-50 text-amber-700",
  agreement_pending: "bg-purple-50 text-purple-700",
  payment_pending: "bg-orange-50 text-orange-700",
  in_progress: "bg-cyan-50 text-cyan-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  disputed: "bg-red-50 text-red-700",
};

const TENANCY_STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  expiring_soon: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
  renewal_pending: "bg-blue-100 text-blue-700",
  agreement_pending: "bg-purple-100 text-purple-700",
  not_started: "bg-gray-100 text-gray-600",
};

const PAYMENT_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannually", label: "Every 6 months" },
  { value: "annually", label: "Annually" },
];

const RENEWAL_OPTIONS = [
  { value: "renewable", label: "Renewable" },
  { value: "not_renewable", label: "Not renewable" },
  {
    value: "subject_to_agreement",
    label: "Subject to a new agreement",
  },
];

const INITIAL_TENANCY_TERMS = {
  startDate: "",
  endDate: "",
  paymentFrequency: "monthly",
  nextPaymentDate: "",
  renewalOption: "subject_to_agreement",
};

function getStatusLabel(status = "") {
  return status.replaceAll("_", " ");
}

function getPersonName(person) {
  if (!person) return "Unknown";

  const name = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ");

  return name || person.name || person.email || "Unknown";
}

function getPropertyTitle(property) {
  if (!property) return "Property unavailable";

  return property.title || property.name || "Untitled property";
}

function formatAmount(amount, currency = "NGN") {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return "—";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toLocaleString()}`;
  }
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toISOString().slice(0, 10);
}

function getPaymentFrequencyLabel(value) {
  return (
    PAYMENT_FREQUENCIES.find((item) => item.value === value)?.label ||
    value ||
    "Not specified"
  );
}

function getRenewalLabel(value) {
  return (
    RENEWAL_OPTIONS.find((item) => item.value === value)?.label ||
    value?.replaceAll("_", " ") ||
    "Not specified"
  );
}

function getRows(result) {
  if (Array.isArray(result?.data)) return result.data;

  if (Array.isArray(result?.data?.transactions)) {
    return result.data.transactions;
  }

  if (Array.isArray(result?.data?.applications)) {
    return result.data.applications;
  }

  if (Array.isArray(result?.transactions)) {
    return result.transactions;
  }

  if (Array.isArray(result?.applications)) {
    return result.applications;
  }

  return [];
}

function isTenancyTransaction(transaction) {
  return ["rent", "lease"].includes(transaction?.transactionType);
}

function getTenancyLifecycleDisplay(lifecycle) {
  if (!lifecycle) {
    return {
      label: "Unavailable",
      style: "bg-gray-100 text-gray-600",
      description: "Expiry information unavailable",
    };
  }

  const status = lifecycle.status || "not_started";
  const days = lifecycle.daysRemaining;
  const expiryDate = formatDate(lifecycle.endDate);

  const descriptions = {
    active:
      days === 0
        ? `Expires today · ${expiryDate}`
        : `Expires ${expiryDate} · ${days} days left`,

    expiring_soon:
      days === 0
        ? `Expires today · ${expiryDate}`
        : `Expires ${expiryDate} · ${days} days left`,

    expired:
      `Expired ${expiryDate}${
        Number.isFinite(days) && days < 0
          ? ` · ${Math.abs(days)} days ago`
          : ""
      }`,

    renewal_pending:
      `Current expiry: ${expiryDate} · Awaiting acceptance`,

    agreement_pending:
      "Initial agreement awaiting acceptance",

    not_started:
      "No accepted agreement yet",
  };

  return {
    label: getStatusLabel(status),
    style:
      TENANCY_STATUS_STYLES[status] ||
      "bg-gray-100 text-gray-600",
    description:
      descriptions[status] || "Tenancy status unavailable",
  };
}

function TenancyTermsDisplay({ tenancyTerms }) {
  if (!tenancyTerms) return null;

  return (
    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
      <div className="flex items-center gap-2">
        <Building2 size={17} className="text-blue-700" />
        <h5 className="font-semibold text-gray-900">
          Tenancy terms
        </h5>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-gray-500">Tenancy start date</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatDate(tenancyTerms.startDate)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Tenancy end date</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatDate(tenancyTerms.endDate)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Payment frequency</p>
          <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
            {getPaymentFrequencyLabel(tenancyTerms.paymentFrequency)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Next payment date</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatDate(tenancyTerms.nextPaymentDate)}
          </p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-xs text-gray-500">Renewal arrangement</p>
          <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
            {getRenewalLabel(tenancyTerms.renewalOption)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TenancyLifecycleCard({ lifecycle }) {
  const display = getTenancyLifecycleDisplay(lifecycle);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Tenancy lifecycle</p>
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${display.style}`}
          >
            {display.label}
          </span>
        </div>

        <Building2 size={20} className="text-green-700" />
      </div>

      <p className="mt-3 text-sm font-medium text-gray-800">
        {display.description}
      </p>

      {lifecycle?.acceptedAgreementVersion && (
        <p className="mt-2 text-xs text-gray-500">
          Accepted agreement: Version {lifecycle.acceptedAgreementVersion}
        </p>
      )}

      {lifecycle?.pendingAgreementVersion && (
        <p className="mt-1 text-xs text-blue-700">
          Pending agreement: Version {lifecycle.pendingAgreementVersion}
        </p>
      )}
    </div>
  );
}

export default function AdminTransactions() {
  const { token } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState("");
  const [agreedAmount, setAgreedAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [creationNote, setCreationNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [agreements, setAgreements] = useState([]);
  const [agreementsLoading, setAgreementsLoading] = useState(false);
  const [agreementError, setAgreementError] = useState("");

  const [transactionPayments, setTransactionPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({
    verifiedAmount: 0,
    outstandingBalance: 0,
  });
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [reviewingPaymentId, setReviewingPaymentId] = useState("");
  const [paymentReviewNotes, setPaymentReviewNotes] = useState({});

  const [showAgreementForm, setShowAgreementForm] = useState(false);
  const [agreementTitle, setAgreementTitle] = useState("");
  const [agreementTerms, setAgreementTerms] = useState("");
  const [tenancyTerms, setTenancyTerms] = useState({
    ...INITIAL_TENANCY_TERMS,
  });
  const [creatingAgreement, setCreatingAgreement] = useState(false);

  const [publishingAgreementId, setPublishingAgreementId] = useState("");
  const [supersedingAgreementId, setSupersedingAgreementId] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const resetAgreementForm = () => {
    setAgreementTitle("");
    setAgreementTerms("");
    setTenancyTerms({ ...INITIAL_TENANCY_TERMS });
  };

  const updateTenancyTerm = (field, value) => {
    setTenancyTerms((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.getAllAdminTransactions(
        {
          page,
          limit: 10,
          status: statusFilter,
          transactionType: typeFilter,
          search: search.trim(),
        },
        token,
      );

      setTransactions(getRows(result));

      setPagination(
        result?.pagination || {
          page,
          totalPages: 1,
          total: getRows(result).length,
        },
      );
    } catch (err) {
      setError(err.message || "Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search, token]);

  const loadTransactionPayments = async (transactionId) => {
    try {
      setPaymentsLoading(true);
      setPaymentError("");

      const result = await api.getAdminTransactionPayments(
        transactionId,
        token,
      );

      const data = result?.data || {};

      setTransactionPayments(
        Array.isArray(data.payments) ? data.payments : [],
      );

      setPaymentSummary({
        verifiedAmount: Number(data.verifiedAmount) || 0,
        outstandingBalance: Number(data.outstandingBalance) || 0,
      });
    } catch (err) {
      setPaymentError(err.message || "Unable to load transaction payments.");
      setTransactionPayments([]);
      setPaymentSummary({
        verifiedAmount: 0,
        outstandingBalance: 0,
      });
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleReviewPayment = async (paymentId, decision) => {
    if (!selectedTransaction?._id) return;

    const reviewNote = paymentReviewNotes[paymentId] || "";

    const confirmed = window.confirm(
      decision === "verified"
        ? "Verify this payment record?"
        : "Reject this payment record?",
    );

    if (!confirmed) return;

    try {
      setReviewingPaymentId(paymentId);
      setPaymentError("");

      await api.reviewAdminTransactionPayment(
        selectedTransaction._id,
        paymentId,
        {
          decision,
          reviewNote: reviewNote.trim(),
        },
        token,
      );

      setPaymentReviewNotes((current) => ({
        ...current,
        [paymentId]: "",
      }));

      await loadTransactionPayments(selectedTransaction._id);
    } catch (err) {
      setPaymentError(err.message || "Unable to review payment.");
    } finally {
      setReviewingPaymentId("");
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const openCreateModal = async () => {
    setShowCreateModal(true);
    setCreateError("");
    setSelectedApplication("");
    setAgreedAmount("");
    setCurrency("NGN");
    setCreationNote("");

    try {
      setApplicationsLoading(true);

      const result = await api.getAllAdminApplications(
        {
          status: "approved",
          page: 1,
          limit: 100,
        },
        token,
      );

      setApprovedApplications(getRows(result));
    } catch (err) {
      setCreateError(err.message || "Unable to load approved applications.");
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleCreateTransaction = async (event) => {
    event.preventDefault();

    if (!selectedApplication) {
      setCreateError("Please select an approved application.");
      return;
    }

    if (!agreedAmount || Number(agreedAmount) <= 0) {
      setCreateError("Enter a valid agreed amount.");
      return;
    }

    if (!/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
      setCreateError("Enter a valid three-letter currency code.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      await api.createAdminTransaction(
        selectedApplication,
        {
          agreedAmount: Number(agreedAmount),
          currency: currency.trim().toUpperCase(),
          note: creationNote.trim(),
        },
        token,
      );

      setShowCreateModal(false);
      setPage(1);

      if (page === 1) {
        await loadTransactions();
      }
    } catch (err) {
      setCreateError(err.message || "Unable to create transaction.");
    } finally {
      setCreating(false);
    }
  };

  const loadAgreements = async (transactionId) => {
    try {
      setAgreementsLoading(true);
      setAgreementError("");

      const result = await api.getAdminTransactionAgreements(
        transactionId,
        token,
      );

      setAgreements(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setAgreementError(err.message || "Unable to load agreements.");
      setAgreements([]);
    } finally {
      setAgreementsLoading(false);
    }
  };

  const openTransactionDetails = async (transactionId) => {
    try {
      setDetailsLoading(true);
      setSelectedTransaction(null);
      setAgreements([]);
      setTransactionPayments([]);
      setPaymentSummary({
        verifiedAmount: 0,
        outstandingBalance: 0,
      });
      setAgreementError("");
      setPaymentError("");
      setShowAgreementForm(false);
      resetAgreementForm();

      const result = await api.getAdminTransaction(transactionId, token);

      const transaction = result?.data || result?.transaction || null;

      setSelectedTransaction(transaction);

      if (transaction?._id) {
        await Promise.all([
          loadAgreements(transaction._id),
          loadTransactionPayments(transaction._id),
        ]);
      }
    } catch (err) {
      setError(err.message || "Unable to load transaction details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeTransactionDetails = () => {
    setSelectedTransaction(null);
    setDetailsLoading(false);
    setShowAgreementForm(false);
    setAgreements([]);
    setTransactionPayments([]);
    setAgreementError("");
    setPaymentError("");
    resetAgreementForm();
  };

  const validateTenancyTerms = () => {
    if (!isTenancyTransaction(selectedTransaction)) {
      return null;
    }

    const {
      startDate,
      endDate,
      paymentFrequency,
      nextPaymentDate,
      renewalOption,
    } = tenancyTerms;

    if (!startDate || !endDate) {
      return "Tenancy start date and end date are required.";
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return "Enter valid tenancy dates.";
    }

    if (end <= start) {
      return "The tenancy end date must be after the start date.";
    }

    if (
      !PAYMENT_FREQUENCIES.some(
        (item) => item.value === paymentFrequency,
      )
    ) {
      return "Select a valid payment frequency.";
    }

    if (
      !RENEWAL_OPTIONS.some(
        (item) => item.value === renewalOption,
      )
    ) {
      return "Select a valid renewal arrangement.";
    }

    if (nextPaymentDate) {
      const nextPayment = new Date(
        `${nextPaymentDate}T00:00:00.000Z`,
      );

      if (Number.isNaN(nextPayment.getTime())) {
        return "Enter a valid next payment date.";
      }

      if (nextPayment < start || nextPayment > end) {
        return "The next payment date must fall within the tenancy period.";
      }
    }

    return null;
  };

  const handleCreateAgreement = async (event) => {
    event.preventDefault();

    if (!selectedTransaction?._id) return;

    if (!agreementTitle.trim() || !agreementTerms.trim()) {
      setAgreementError("Agreement title and terms are required.");
      return;
    }

    const tenancyValidationError = validateTenancyTerms();

    if (tenancyValidationError) {
      setAgreementError(tenancyValidationError);
      return;
    }

    try {
      setCreatingAgreement(true);
      setAgreementError("");

      const payload = {
        title: agreementTitle.trim(),
        terms: agreementTerms.trim(),
      };

      if (isTenancyTransaction(selectedTransaction)) {
        payload.tenancyTerms = {
          startDate: tenancyTerms.startDate,
          endDate: tenancyTerms.endDate,
          paymentFrequency: tenancyTerms.paymentFrequency,
          nextPaymentDate: tenancyTerms.nextPaymentDate || null,
          renewalOption: tenancyTerms.renewalOption,
        };
      }

      await api.createAdminTransactionAgreement(
        selectedTransaction._id,
        payload,
        token,
      );

      resetAgreementForm();
      setShowAgreementForm(false);

      await loadAgreements(selectedTransaction._id);
    } catch (err) {
      setAgreementError(err.message || "Unable to create agreement.");
    } finally {
      setCreatingAgreement(false);
    }
  };

  const handlePublishAgreement = async (agreementId) => {
    if (!selectedTransaction?._id) return;

    try {
      setPublishingAgreementId(agreementId);
      setAgreementError("");

      await api.publishAdminTransactionAgreement(
        selectedTransaction._id,
        agreementId,
        token,
      );

      await loadAgreements(selectedTransaction._id);
    } catch (err) {
      setAgreementError(err.message || "Unable to publish agreement.");
    } finally {
      setPublishingAgreementId("");
    }
  };

  const handleSupersedeAgreement = async (agreementId) => {
    if (!selectedTransaction?._id) return;

    const confirmed = window.confirm(
      "Supersede this agreement? Its history and party responses will be preserved, and you can create a revised version.",
    );

    if (!confirmed) return;

    try {
      setSupersedingAgreementId(agreementId);
      setAgreementError("");

      await api.supersedeAdminTransactionAgreement(
        selectedTransaction._id,
        agreementId,
        token,
      );

      resetAgreementForm();
      setShowAgreementForm(true);

      await loadAgreements(selectedTransaction._id);
    } catch (err) {
      setAgreementError(err.message || "Unable to supersede agreement.");
    } finally {
      setSupersedingAgreementId("");
    }
  };

  const openStatusModal = () => {
    setNextStatus("");
    setStatusNote("");
    setStatusError("");
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (event) => {
    event.preventDefault();

    if (!selectedTransaction?._id || !nextStatus) {
      setStatusError("Select the next transaction status.");
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");

      await api.updateAdminTransactionStatus(
        selectedTransaction._id,
        {
          status: nextStatus,
          note: statusNote.trim(),
        },
        token,
      );

      setShowStatusModal(false);

      await openTransactionDetails(selectedTransaction._id);
      await loadTransactions();
    } catch (err) {
      setStatusError(err.message || "Unable to update transaction status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1);

  const availableTransitions =
    STATUS_TRANSITIONS[selectedTransaction?.status] || [];

  const isTenancy = isTenancyTransaction(selectedTransaction);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <ArrowLeftRight size={17} />
            Platform management
          </div>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Transactions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage property transactions and monitor their progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadTransactions}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
          >
            <Plus size={17} />
            Create transaction
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Transactions found</p>
            <ArrowLeftRight className="text-green-700" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {pagination?.total ?? transactions.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Current page</p>
            <FileText className="text-blue-700" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {page} / {totalPages}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Displayed records</p>
            <Building2 className="text-yellow-600" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {transactions.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search reference, property or member..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-600"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_TRANSITIONS).map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-600"
          >
            <option value="">All transaction types</option>
            <option value="purchase">Purchase</option>
            <option value="rent">Rent</option>
            <option value="lease">Lease</option>
          </select>
        </div>
      </div>

      {/* Transaction table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {error && (
          <div className="m-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight size={36} className="mx-auto text-gray-300" />
            <h3 className="mt-3 font-semibold text-gray-800">
              No transactions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Transactions will appear here once they are created.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Transaction</th>
                    <th className="px-5 py-4">Property</th>
                    <th className="px-5 py-4">Buyer / Seller</th>
                    <th className="px-5 py-4">Agreed amount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Tenancy</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {transactions.map((transaction) => {
                    const tenancy = isTenancyTransaction(transaction);
                    const lifecycle = transaction.tenancyLifecycle;
                    const lifecycleDisplay =
                      getTenancyLifecycleDisplay(lifecycle);

                    return (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {transaction.transactionReference || "—"}
                          </p>
                          <p className="mt-1 text-xs capitalize text-gray-500">
                            {transaction.transactionType || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[190px] truncate text-sm font-medium text-gray-800">
                            {getPropertyTitle(transaction.property)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <p className="text-gray-800">
                            {getPersonName(transaction.buyer)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Seller: {getPersonName(transaction.seller)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatAmount(
                            transaction.agreedAmount,
                            transaction.currency,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              STATUS_STYLES[transaction.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {getStatusLabel(transaction.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {tenancy ? (
                            <div className="min-w-[190px]">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${lifecycleDisplay.style}`}
                              >
                                {lifecycleDisplay.label}
                              </span>
                              <p className="mt-2 text-xs leading-5 text-gray-500">
                                {lifecycleDisplay.description}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Not applicable
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              openTransactionDetails(transaction._id)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-green-600 hover:text-green-700"
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create transaction modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-4 w-full max-w-2xl rounded-2xl bg-white shadow-xl sm:my-8">
            <div className="sticky top-0 z-20 flex items-center justify-between rounded-t-2xl border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Create transaction
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Start a transaction from an approved application.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close create transaction modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-5 p-6">
              {createError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Approved property application
                </label>

                <select
                  value={selectedApplication}
                  onChange={(event) =>
                    setSelectedApplication(event.target.value)
                  }
                  disabled={applicationsLoading}
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                >
                  <option value="">
                    {applicationsLoading
                      ? "Loading approved applications..."
                      : "Select an application"}
                  </option>

                  {approvedApplications.map((application) => (
                    <option key={application._id} value={application._id}>
                      {getPropertyTitle(application.property)} —{" "}
                      {getPersonName(
                        application.applicant || application.user,
                      )}
                    </option>
                  ))}
                </select>

                {!applicationsLoading &&
                  approvedApplications.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      No approved applications are currently available.
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Agreed amount
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={agreedAmount}
                    onChange={(event) => setAgreedAmount(event.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value.toUpperCase())
                    }
                    placeholder="NGN"
                    className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm uppercase outline-none focus:border-green-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Admin note (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={creationNote}
                  onChange={(event) => setCreationNote(event.target.value)}
                  placeholder="Add relevant transaction notes..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || applicationsLoading}
                  className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction details modal */}
      {(detailsLoading || selectedTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">
                  Transaction details
                </h2>
                <p className="mt-1 truncate text-sm text-gray-500">
                  Reference:{" "}
                  {selectedTransaction?.transactionReference || "Loading..."}
                </p>
              </div>
            </div>

            {/* Scrollable modal content */}
            {detailsLoading ? (
              <div className="min-h-0 flex-1 overflow-y-auto p-10 text-center text-sm text-gray-500">
                Loading transaction details...
              </div>
            ) : (
              selectedTransaction && (
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                  {/* Transaction information */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Property</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {getPropertyTitle(selectedTransaction.property)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Agreed amount</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatAmount(
                          selectedTransaction.agreedAmount,
                          selectedTransaction.currency,
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Transaction type</p>
                      <p className="mt-1 font-semibold capitalize text-gray-900">
                        {selectedTransaction.transactionType || "—"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Buyer</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {getPersonName(selectedTransaction.buyer)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Seller / Owner</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {getPersonName(selectedTransaction.seller)}
                      </p>
                    </div>
                  </div>

                  {/* Tenancy lifecycle details */}
                  {isTenancy && (
                    <TenancyLifecycleCard
                      lifecycle={selectedTransaction.tenancyLifecycle}
                    />
                  )}

                  {/* Current status */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Current status</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          STATUS_STYLES[selectedTransaction.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getStatusLabel(selectedTransaction.status)}
                      </span>
                    </div>

                    {availableTransitions.length > 0 && (
                      <button
                        type="button"
                        onClick={openStatusModal}
                        className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                      >
                        Update status
                      </button>
                    )}
                  </div>

                  {/* Agreement management */}
                  <div className="space-y-4 rounded-xl border border-gray-200 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Agreement management
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Prepare and publish transaction agreements for both
                          parties.
                        </p>
                      </div>

                      {(agreements.length === 0 ||
                        agreements[0]?.status === "superseded") && (
                        <button
                          type="button"
                          onClick={() => {
                            setAgreementError("");
                            setShowAgreementForm((current) => !current);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                        >
                          <Plus size={16} />
                          Create agreement
                        </button>
                      )}
                    </div>

                    {agreementError && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {agreementError}
                      </div>
                    )}

                    {showAgreementForm && (
                      <form
                        onSubmit={handleCreateAgreement}
                        className="space-y-4 rounded-lg bg-gray-50 p-4"
                      >
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Agreement title
                          </label>
                          <input
                            type="text"
                            value={agreementTitle}
                            onChange={(event) =>
                              setAgreementTitle(event.target.value)
                            }
                            maxLength={200}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
                            placeholder={
                              isTenancy
                                ? "e.g. Residential Tenancy Agreement"
                                : "e.g. Property Purchase Agreement"
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Agreement terms
                          </label>
                          <textarea
                            value={agreementTerms}
                            onChange={(event) =>
                              setAgreementTerms(event.target.value)
                            }
                            maxLength={20000}
                            required
                            rows={8}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
                            placeholder="Enter the proposed agreement terms..."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Maximum 20,000 characters.
                          </p>
                        </div>

                        {/* Structured tenancy terms */}
                        {isTenancy && (
                          <div className="space-y-4 rounded-xl border border-blue-200 bg-white p-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Tenancy details
                              </h4>
                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                These details will be stored with this
                                agreement version and shown to both parties
                                when they review it.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Tenancy start date
                                </label>
                                <input
                                  type="date"
                                  value={tenancyTerms.startDate}
                                  onChange={(event) =>
                                    updateTenancyTerm(
                                      "startDate",
                                      event.target.value,
                                    )
                                  }
                                  required
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Tenancy end date
                                </label>
                                <input
                                  type="date"
                                  value={tenancyTerms.endDate}
                                  min={tenancyTerms.startDate || undefined}
                                  onChange={(event) =>
                                    updateTenancyTerm(
                                      "endDate",
                                      event.target.value,
                                    )
                                  }
                                  required
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Payment frequency
                                </label>
                                <select
                                  value={tenancyTerms.paymentFrequency}
                                  onChange={(event) =>
                                    updateTenancyTerm(
                                      "paymentFrequency",
                                      event.target.value,
                                    )
                                  }
                                  required
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
                                >
                                  {PAYMENT_FREQUENCIES.map((frequency) => (
                                    <option
                                      key={frequency.value}
                                      value={frequency.value}
                                    >
                                      {frequency.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Next payment date
                                </label>
                                <input
                                  type="date"
                                  value={tenancyTerms.nextPaymentDate}
                                  min={tenancyTerms.startDate || undefined}
                                  max={tenancyTerms.endDate || undefined}
                                  onChange={(event) =>
                                    updateTenancyTerm(
                                      "nextPaymentDate",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Optional. Leave blank if not yet agreed.
                                </p>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Renewal arrangement
                                </label>
                                <select
                                  value={tenancyTerms.renewalOption}
                                  onChange={(event) =>
                                    updateTenancyTerm(
                                      "renewalOption",
                                      event.target.value,
                                    )
                                  }
                                  required
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
                                >
                                  {RENEWAL_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                              Confirm all tenancy dates, payment arrangements
                              and renewal conditions with both parties before
                              publishing the agreement.
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAgreementForm(false);
                              setAgreementError("");
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={creatingAgreement}
                            className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {creatingAgreement ? "Creating..." : "Save draft"}
                          </button>
                        </div>
                      </form>
                    )}

                    {agreementsLoading ? (
                      <p className="text-sm text-gray-500">
                        Loading agreements...
                      </p>
                    ) : agreements.length > 0 ? (
                      <div className="space-y-4">
                        {agreements.map((agreement) => (
                          <div
                            key={agreement._id}
                            className="rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {agreement.title}
                                </h4>
                                <p className="mt-1 text-xs text-gray-500">
                                  Version {agreement.version} · Created{" "}
                                  {formatDate(agreement.createdAt)}
                                </p>
                              </div>

                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                                {getStatusLabel(agreement.status)}
                              </span>
                            </div>

                            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                              {agreement.terms}
                            </div>

                            {agreement.tenancyTerms && (
                              <TenancyTermsDisplay
                                tenancyTerms={agreement.tenancyTerms}
                              />
                            )}

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {[
                                {
                                  label: "Buyer response",
                                  response: agreement.buyerResponse,
                                },
                                {
                                  label: "Seller response",
                                  response: agreement.sellerResponse,
                                },
                              ].map(({ label, response }) => (
                                <div
                                  key={label}
                                  className="rounded-lg border border-gray-100 p-3"
                                >
                                  <p className="text-xs font-semibold text-gray-500">
                                    {label}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                                    {response?.decision || "pending"}
                                  </p>
                                  {response?.note && (
                                    <p className="mt-1 text-sm text-gray-600">
                                      {response.note}
                                    </p>
                                  )}
                                  {response?.respondedAt && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      {formatDate(response.respondedAt)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {agreement.status === "draft" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePublishAgreement(agreement._id)
                                }
                                disabled={Boolean(publishingAgreementId)}
                                className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                              >
                                {publishingAgreementId === agreement._id
                                  ? "Publishing..."
                                  : "Publish for review"}
                              </button>
                            )}

                            {agreement._id === agreements[0]?._id &&
                              [
                                "pending_review",
                                "accepted",
                                "rejected",
                              ].includes(agreement.status) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSupersedeAgreement(agreement._id)
                                  }
                                  disabled={Boolean(supersedingAgreementId)}
                                  className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                                >
                                  {supersedingAgreementId === agreement._id
                                    ? "Superseding..."
                                    : "Supersede agreement"}
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No agreement has been created for this transaction yet.
                      </p>
                    )}
                  </div>

                  {/* Transaction history */}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Transaction history
                    </h3>

                    <div className="mt-4 space-y-4">
                      {selectedTransaction.statusHistory?.length ? (
                        selectedTransaction.statusHistory.map((item, index) => (
                          <div key={item._id || index} className="flex gap-3">
                            <div className="mt-1">
                              {item.status === "completed" ? (
                                <CheckCircle2
                                  size={18}
                                  className="text-green-600"
                                />
                              ) : item.status === "cancelled" ? (
                                <XCircle
                                  size={18}
                                  className="text-gray-500"
                                />
                              ) : (
                                <Clock
                                  size={18}
                                  className="text-blue-600"
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1 border-b border-gray-100 pb-4">
                              <p className="font-medium capitalize text-gray-800">
                                {getStatusLabel(item.status)}
                              </p>

                              {item.note && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {item.note}
                                </p>
                              )}

                              <p className="mt-1 text-xs text-gray-400">
                                {getPersonName(item.changedBy)} ·{" "}
                                {formatDate(item.changedAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No transaction history is available.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment management */}
                  <div className="space-y-4 rounded-xl border border-gray-200 p-4 sm:p-5">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Payment management
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Review payment records submitted by the buyer. Only
                        verified records count toward the amount paid.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Agreed amount</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {formatAmount(
                            selectedTransaction.agreedAmount,
                            selectedTransaction.currency,
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Verified payments
                        </p>
                        <p className="mt-1 font-semibold text-green-700">
                          {formatAmount(
                            paymentSummary.verifiedAmount,
                            selectedTransaction.currency,
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Outstanding balance
                        </p>
                        <p className="mt-1 font-semibold text-amber-700">
                          {formatAmount(
                            paymentSummary.outstandingBalance,
                            selectedTransaction.currency,
                          )}
                        </p>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {paymentError}
                      </div>
                    )}

                    {paymentsLoading ? (
                      <p className="text-sm text-gray-500">
                        Loading payment records...
                      </p>
                    ) : transactionPayments.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
                        <p className="text-sm text-gray-500">
                          No payment records have been submitted for this
                          transaction.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactionPayments.map((payment) => (
                          <div
                            key={payment._id}
                            className="rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {payment.payer
                                    ? `${payment.payer.firstName || ""} ${
                                        payment.payer.lastName || ""
                                      }`.trim()
                                    : "Buyer"}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  Submitted: {formatDate(payment.submittedAt)}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  payment.status === "verified"
                                    ? "bg-green-100 text-green-700"
                                    : payment.status === "rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                              <div>
                                <p className="text-gray-500">Amount</p>
                                <p className="font-semibold text-gray-900">
                                  {formatAmount(
                                    payment.amount,
                                    payment.currency,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-500">Payment type</p>
                                <p className="font-medium text-gray-900">
                                  {payment.paymentType}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-500">Payment method</p>
                                <p className="font-medium capitalize text-gray-900">
                                  {payment.paymentMethod?.replaceAll(
                                    "_",
                                    " ",
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-500">
                                  Payment reference
                                </p>
                                <p className="break-all font-medium text-gray-900">
                                  {payment.paymentReference || "Not provided"}
                                </p>
                              </div>
                            </div>

                            {payment.note && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500">
                                  Payer's note
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                                  {payment.note}
                                </p>
                              </div>
                            )}

                            {payment.evidenceUrl && (
                              <a
                                href={payment.evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline"
                              >
                                View payment evidence
                              </a>
                            )}

                            {payment.status === "pending" ? (
                              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                                <label className="block">
                                  <span className="mb-1 block text-xs font-medium text-gray-600">
                                    Review note (optional)
                                  </span>

                                  <textarea
                                    rows={2}
                                    value={
                                      paymentReviewNotes[payment._id] || ""
                                    }
                                    onChange={(event) =>
                                      setPaymentReviewNotes((current) => ({
                                        ...current,
                                        [payment._id]: event.target.value,
                                      }))
                                    }
                                    maxLength={2000}
                                    placeholder="Add a note about this payment review..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                  />
                                </label>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReviewPayment(
                                        payment._id,
                                        "verified",
                                      )
                                    }
                                    disabled={Boolean(reviewingPaymentId)}
                                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {reviewingPaymentId === payment._id
                                      ? "Processing..."
                                      : "Verify payment"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReviewPayment(
                                        payment._id,
                                        "rejected",
                                      )
                                    }
                                    disabled={Boolean(reviewingPaymentId)}
                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Reject payment
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                                <p className="font-medium text-gray-700">
                                  {payment.status === "verified"
                                    ? "Payment verified"
                                    : "Payment rejected"}
                                </p>

                                {payment.reviewNote && (
                                  <p className="mt-1 whitespace-pre-wrap text-gray-600">
                                    {payment.reviewNote}
                                  </p>
                                )}

                                {payment.verifiedAt && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Reviewed: {formatDate(payment.verifiedAt)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Fixed modal footer */}
            {!detailsLoading && selectedTransaction && (
              <div className="flex shrink-0 justify-end border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeTransactionDetails}
                  className="inline-flex min-w-28 items-center justify-center rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status update modal */}
      {showStatusModal && selectedTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="font-bold text-gray-900">
                Update transaction status
              </h2>

              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close status update modal"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-5 p-6">
              {statusError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {statusError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New status
                </label>

                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                  required
                >
                  <option value="">Select next status</option>
                  {availableTransitions.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Update note (optional)
                </label>

                <textarea
                  rows={3}
                  maxLength={2000}
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Explain this status update..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {updatingStatus ? "Updating..." : "Save status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}