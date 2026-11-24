
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSearch,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  CalendarDays,
  FileText,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "needs_correction", label: "Needs correction" },
  { value: "rejected", label: "Rejected" },
  { value: "verified", label: "Verified" },
];

const STATUS_STYLES = {
  submitted: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  needs_correction: "bg-orange-50 text-orange-700",
  rejected: "bg-red-50 text-red-700",
  verified: "bg-green-50 text-green-700",
};

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getPropertyLocation = (property) => {
  const location = property?.location;

  if (!location) return "Location unavailable";

  return [
    location.area,
    location.city,
    location.state,
  ]
    .filter(Boolean)
    .join(", ") || location.address || "Location unavailable";
};

export default function AdminDueDiligence() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();

  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCases = useCallback(
    async (showRefresh = false) => {
      if (!token) return;

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.getAdminDueDiligenceCases(token, {
          page: pagination.page,
          limit: pagination.limit,
          status,
        });

        setCases(response.data || []);

        setPagination((current) => ({
          ...current,
          ...(response.pagination || {}),
        }));
      } catch (error) {
        toast.error(
          error.message || "Unable to load due diligence cases."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, pagination.page, pagination.limit, status]
  );

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleStatusChange = (value) => {
    setStatus(value);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const changePage = (nextPage) => {
    setPagination((current) => ({
      ...current,
      page: nextPage,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Property management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Due Diligence
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review property documents and manage verification cases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadCases(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total cases</p>
            <FileSearch className="text-green-700" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {pagination.total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Cases on this page</p>
            <FileText className="text-blue-700" size={21} />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {cases.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Verification cases
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a case to inspect its submitted documents.
            </p>
          </div>

          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 sm:w-52"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center">
            <FileSearch
              size={42}
              className="mx-auto text-slate-300"
            />
            <h3 className="mt-4 font-semibold text-slate-800">
              No due diligence cases found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Cases will appear here when property owners begin submitting
              documents.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {cases.map((caseRecord) => {
              const property = caseRecord.property || {};
              const owner = caseRecord.owner || {};
              const documents = caseRecord.documents || [];

              return (
                <div
                  key={caseRecord._id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50/20 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {property.title || "Untitled property"}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            STATUS_STYLES[caseRecord.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(caseRecord.status)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-4">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={15} />
                          {getPropertyLocation(property)}
                        </span>

                        <span>
                          Owner: {owner.name || "Unknown owner"}
                        </span>

                        <span>
                          {owner.email || "No email available"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                          {formatStatus(property.propertyType || caseRecord.propertyType || "Property")}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                          {formatStatus(property.transactionType || caseRecord.transactionType || "Transaction")}
                        </span>

                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
                          {documents.length} document(s)
                        </span>
                      </div>

                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <CalendarDays size={14} />
                        Updated {formatDate(caseRecord.updatedAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/due-diligence/${caseRecord._id}`)
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                      <Eye size={16} />
                      Review case
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && pagination.pages > 1 && (
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total cases
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => changePage(pagination.page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => changePage(pagination.page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
