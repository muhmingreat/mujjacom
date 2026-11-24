
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  RefreshCw,
  MapPin,
  CalendarDays,
  Eye,
  XCircle,
  Clock3,
  CheckCircle2,
  AlertCircle,
  LoaderCircle
} from "lucide-react";
import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";


const statusStyles = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-100 text-gray-600 border-gray-200"
};

const statusLabels = {
  pending: "Pending",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn"
};

function formatPrice(price, currency = "NGN") {
  if (price === undefined || price === null) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(price);
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function StatusBadge({ status }) {
  const Icon =
    status === "approved"
      ? CheckCircle2
      : status === "rejected"
        ? XCircle
        : status === "pending"
          ? Clock3
          : AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      <Icon size={14} />
      {statusLabels[status] || status}
    </span>
  );
}

export default function MyApplicationsPage() {
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [withdrawingId, setWithdrawingId] = useState("");

  const loadApplications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.getMyApplications(token);
      setApplications(response.applications || []);
    } catch (err) {
      setError(err.message || "Unable to load your applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function handleWithdraw(applicationId) {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) return;

    setWithdrawingId(applicationId);
    setError("");
    setSuccess("");

    try {
      const response = await api.withdrawApplication(
        applicationId,
        token
      );

      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId
            ? { ...application, status: "withdrawn" }
            : application
        )
      );

      setSuccess(
        response.message || "Application withdrawn successfully."
      );
    } catch (err) {
      setError(err.message || "Unable to withdraw this application.");
    } finally {
      setWithdrawingId("");
    }
  }

  const pendingCount = applications.filter(
    (item) => item.status === "pending"
  ).length;

  const reviewCount = applications.filter(
    (item) => item.status === "under_review"
  ).length;

  const approvedCount = applications.filter(
    (item) => item.status === "approved"
  ).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159447]">
            Member workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            My Applications
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Track and manage your property applications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadApplications(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Under review</p>
          <p className="mt-2 text-3xl font-bold text-[#1769AA]">
            {reviewCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="mt-2 text-3xl font-bold text-[#159447]">
            {approvedCount}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-100 bg-white">
          <div className="text-center">
            <LoaderCircle
              size={32}
              className="mx-auto animate-spin text-[#159447]"
            />
            <p className="mt-3 text-sm text-gray-500">
              Loading your applications...
            </p>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-[#159447]">
            <FileText size={30} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            No applications yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            When you apply for a property, your applications and their
            progress will appear here.
          </p>

          <Link
            to="/properties"
            className="mt-6 inline-flex rounded-xl bg-[#159447] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#117b3b]"
          >
            Explore properties
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {applications.map((application) => {
            const property = application.property;
            const canWithdraw = ["pending", "under_review"].includes(
              application.status
            );

            return (
              <article
                key={application._id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
                  <div className="h-48 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-40 sm:w-52">
                    {property?.coverImage ? (
                      <img
                        src={property.coverImage}
                        alt={property.title || "Property"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <FileText size={35} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <StatusBadge status={application.status} />

                      <span className="text-xs text-gray-400">
                        Application #{application._id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <h2 className="mt-3 text-lg font-bold text-gray-900">
                      {property?.title || "Property no longer available"}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                      {property?.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={15} />
                          {[property.location.city, property.location.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        Applied {formatDate(application.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-400">
                          Application type
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                          {application.applicationType}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Property price</p>
                        <p className="mt-1 text-sm font-bold text-[#159447]">
                          {property
                            ? formatPrice(property.price, property.currency)
                            : "Unavailable"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {property && (
                        <Link
                          to={`/properties/${property._id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#159447] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117b3b]"
                        >
                          <Eye size={16} />
                          View property
                        </Link>
                      )}

                      {canWithdraw && (
                        <button
                          type="button"
                          onClick={() => handleWithdraw(application._id)}
                          disabled={withdrawingId === application._id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          {withdrawingId === application._id ? (
                            <LoaderCircle
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Withdraw application
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
