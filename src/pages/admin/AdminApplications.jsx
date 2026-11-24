
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle
} from "lucide-react";
import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-700"
};

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());

const formatCurrency = (amount, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount || 0);

export default function AdminApplications() {
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [applicationType, setApplicationType] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadApplications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const params = {
        search,
        status,
        applicationType,
        sort,
        page,
        limit: 12
      };

      const [listResponse, totalResponse, ...statusResponses] =
        await Promise.all([
          api.getAllAdminApplications(params, token),
          api.getAllAdminApplications({ limit: 1 }, token),
          ...["pending", "under_review", "approved", "rejected"].map(
            item => api.getAllAdminApplications(
              { status: item, limit: 1 },
              token
            )
          )
        ]);

      setApplications(listResponse.data || []);
      setPagination(listResponse.pagination || {
        total: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false
      });

      setCounts({
        total: totalResponse.pagination?.total || 0,
        pending: statusResponses[0].pagination?.total || 0,
        under_review: statusResponses[1].pagination?.total || 0,
        approved: statusResponses[2].pagination?.total || 0,
        rejected: statusResponses[3].pagination?.total || 0
      });
    } catch (err) {
      setError(err.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, [token, search, status, applicationType, sort, page]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const updateStatus = async (applicationId, newStatus) => {
    const reviewNote =
      newStatus === "rejected"
        ? window.prompt("Please enter a reason for rejecting this application:")
        : "";

    if (newStatus === "rejected" && !reviewNote?.trim()) return;

    if (
      !window.confirm(
        `Are you sure you want to mark this application as ${formatStatus(newStatus)}?`
      )
    ) {
      return;
    }

    setUpdatingId(applicationId);

    try {
      await api.updateAdminApplication(
        applicationId,
        { status: newStatus, reviewNote },
        token
      );

      await loadApplications();
    } catch (err) {
      setError(err.message || "Unable to update application.");
    } finally {
      setUpdatingId("");
    }
  };

  const statCards = [
    {
      label: "Total applications",
      value: counts.total,
      icon: FileText,
      color: "text-gray-700",
      bg: "bg-gray-100"
    },
    {
      label: "Pending",
      value: counts.pending,
      icon: Clock,
      color: "text-yellow-700",
      bg: "bg-yellow-100"
    },
    {
      label: "Under review",
      value: counts.under_review,
      icon: Eye,
      color: "text-blue-700",
      bg: "bg-blue-100"
    },
    {
      label: "Approved",
      value: counts.approved,
      icon: CheckCircle2,
      color: "text-green-700",
      bg: "bg-green-100"
    },
    {
      label: "Rejected",
      value: counts.rejected,
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-100"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Application Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage property purchase, rental and lease applications.
          </p>
        </div>

        <button
          onClick={loadApplications}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(card => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${card.bg} ${card.color}`}>
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search applicant or property..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            value={status}
            onChange={event => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-600"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <select
            value={applicationType}
            onChange={event => {
              setApplicationType(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-600"
          >
            <option value="">All application types</option>
            <option value="purchase">Purchase</option>
            <option value="rent">Rent</option>
            <option value="lease">Lease</option>
          </select>

          <select
            value={sort}
            onChange={event => {
              setSort(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-600"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Applications</h2>
          <span className="text-sm text-gray-500">
            {pagination.total || 0} results
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={36} className="mx-auto text-gray-300" />
            <p className="mt-3 font-medium text-gray-700">
              No applications found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Applications will appear here when users apply for properties.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Property</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {applications.map(application => {
                  const applicant = application.applicant || {};
                  const property = application.property || {};

                  return (
                    <tr key={application._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {[applicant.firstName, applicant.lastName]
                            .filter(Boolean)
                            .join(" ") || "Unknown applicant"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {applicant.email || "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[220px] truncate font-medium text-gray-800">
                          {property.title || "Property unavailable"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {property.price != null
                            ? formatCurrency(property.price, property.currency)
                            : "Price unavailable"}
                        </p>
                      </td>

                      <td className="px-5 py-4 capitalize text-gray-600">
                        {application.applicationType || "—"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {application.createdAt
                          ? new Date(application.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[application.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {formatStatus(application.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {["pending", "under_review"].includes(application.status) ? (
                          <div className="flex flex-wrap gap-2">
                            {application.status === "pending" && (
                              <button
                                onClick={() =>
                                  updateStatus(application._id, "under_review")
                                }
                                disabled={updatingId === application._id}
                                className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                              >
                                Review
                              </button>
                            )}

                            <button
                              onClick={() =>
                                updateStatus(application._id, "approved")
                              }
                              disabled={updatingId === application._id}
                              className="rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(application._id, "rejected")
                              }
                              disabled={updatingId === application._id}
                              className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page || page} of {pagination.totalPages || 1}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={!pagination.hasPreviousPage || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={() => setPage(current => current + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
