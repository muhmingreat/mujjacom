
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  SlidersHorizontal,
  Eye,
  Archive,
  RotateCcw,
  EyeOff,
  Globe,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const initialFilters = {
  search: "",
  propertyType: "",
  transactionType: "",
  status: "",
  verificationStatus: "",
  sort: "newest"
};

const emptyPagination = {
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false
};

function StatusBadge({ value }) {
  const styles = {
    published: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-700",
    reserved: "bg-blue-100 text-blue-700",
    sold: "bg-purple-100 text-purple-700",
    leased: "bg-indigo-100 text-indigo-700",
    rented: "bg-indigo-100 text-indigo-700",
    archived: "bg-gray-200 text-gray-600",
    verified: "bg-green-100 text-green-700",
    pending_review: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    not_submitted: "bg-gray-100 text-gray-600"
  };

  const label = (value || "unknown").replaceAll("_", " ");

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
      styles[value] || "bg-gray-100 text-gray-600"
    }`}>
      {label}
    </span>
  );
}

function formatPrice(price, currency = "NGN") {
  if (price === undefined || price === null || price === "") {
    return "Price unavailable";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(price);
  } catch {
    return `${currency} ${Number(price).toLocaleString("en-NG")}`;
  }
}

function formatPriceFrequency(property) {
  if (!["rent", "lease"].includes(property.transactionType)) {
    return "";
  }

  const labels = {
    one_time: "one-time",
    monthly: "per month",
    quarterly: "per quarter",
    biannually: "every six months",
    annually: "per year"
  };

  return labels[property.priceFrequency] || "";
}

function getActionConfirmation(action, title) {
  const messages = {
    archive: `Archive "${title}"? It will no longer appear as an active listing.`,
    restore: `Restore "${title}" to Draft? It will not be published automatically.`,
    unpublish: `Unpublish "${title}"? It will be moved back to Draft.`,
    republish: `Republish "${title}"? It will become publicly available again.`
  };

  return messages[action];
}

export default function AdminProperties() {
  const { token } = useAuth();

  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState(emptyPagination);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState({});

  const fetchProperties = useCallback(async (page = 1) => {
    if (!token) {
      setLoading(false);
      setError("Your admin session is unavailable. Please sign in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.getAllAdminProperties(
        {
          ...appliedFilters,
          page,
          limit: 12
        },
        token
      );

      setProperties(response.data || []);
      setPagination(response.pagination || emptyPagination);
    } catch (err) {
      setError(err.message || "Unable to load properties.");
    } finally {
      setLoading(false);
    }
  }, [token, appliedFilters]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters(current => ({
      ...current,
      [name]: value
    }));
  }

  function handleSearch(event) {
    event.preventDefault();
    setSuccess("");
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  async function handlePropertyAction(property, action) {
    const confirmation = getActionConfirmation(action, property.title);

    if (!window.confirm(confirmation)) return;

    const propertyId = property._id;

    setProcessing(current => ({
      ...current,
      [propertyId]: action
    }));

    setError("");
    setSuccess("");

    try {
      const actionMethods = {
        archive: api.archiveProperty,
        restore: api.restoreArchivedProperty,
        unpublish: api.unpublishProperty,
        republish: api.republishProperty
      };

      const response = await actionMethods[action](propertyId, token);

      setSuccess(
        response.message || "Property updated successfully."
      );

      await fetchProperties(pagination.page || 1);
    } catch (err) {
      setError(err.message || "Unable to update this property.");
    } finally {
      setProcessing(current => {
        const updated = { ...current };
        delete updated[propertyId];
        return updated;
      });
    }
  }

  function renderActions(property) {
    const currentAction = processing[property._id];
    const protectedStatus = [
      "reserved",
      "sold",
      "leased",
      "rented"
    ].includes(property.status);

    return (
      <div className="flex min-w-[190px] flex-wrap items-center gap-2">
        <Link
          to={`/admin/property-reviews/${property._id}?from=properties`}
          title="View property details"
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <Eye size={15} />
          View
        </Link>

        {property.status === "published" && (
          <>
            <button
              type="button"
              onClick={() => handlePropertyAction(property, "unpublish")}
              disabled={Boolean(currentAction)}
              title="Move this property back to Draft"
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-50 disabled:opacity-50"
            >
              <EyeOff size={15} />
              {currentAction === "unpublish" ? "Working..." : "Unpublish"}
            </button>

            <button
              type="button"
              onClick={() => handlePropertyAction(property, "archive")}
              disabled={Boolean(currentAction) || protectedStatus}
              title={
                protectedStatus
                  ? "Transaction-related statuses cannot be archived."
                  : "Archive property"
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Archive size={15} />
              {currentAction === "archive" ? "Working..." : "Archive"}
            </button>
          </>
        )}

        {property.status === "draft" && (
          <>
            {property.verificationStatus === "verified" && (
              <button
                type="button"
                onClick={() => handlePropertyAction(property, "republish")}
                disabled={Boolean(currentAction)}
                title="Publish this verified property"
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
              >
                <Globe size={15} />
                {currentAction === "republish" ? "Working..." : "Republish"}
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePropertyAction(property, "archive")}
              disabled={Boolean(currentAction)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <Archive size={15} />
              {currentAction === "archive" ? "Working..." : "Archive"}
            </button>
          </>
        )}

        {property.status === "archived" && (
          <button
            type="button"
            onClick={() => handlePropertyAction(property, "restore")}
            disabled={Boolean(currentAction)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
          >
            <RotateCcw size={15} />
            {currentAction === "restore" ? "Working..." : "Restore"}
          </button>
        )}

        {protectedStatus && (
          <span className="text-xs text-gray-400">
            Transaction protected
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            All Properties
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor property listings across the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchProperties(pagination.page || 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total properties</p>
            <Building2 className="text-green-700" size={21} />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {pagination.total.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Current page</p>
            <SlidersHorizontal className="text-blue-700" size={21} />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {pagination.totalPages
              ? `${pagination.page} / ${pagination.totalPages}`
              : "0"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-green-700" />
          <h2 className="font-semibold text-gray-900">
            Search and filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative sm:col-span-2 lg:col-span-3">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search title, location, city or state..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            name="propertyType"
            value={filters.propertyType}
            onChange={handleFilterChange}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="">All property types</option>
            <option value="land">Land</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="commercial">Commercial</option>
            <option value="other">Other</option>
          </select>

          <select
            name="transactionType"
            value={filters.transactionType}
            onChange={handleFilterChange}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="">All transaction types</option>
            <option value="sale">Sale</option>
            <option value="lease">Lease</option>
            <option value="rent">Rent</option>
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="">All listing statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="leased">Leased</option>
            <option value="rented">Rented</option>
            <option value="archived">Archived</option>
          </select>

          <select
            name="verificationStatus"
            value={filters.verificationStatus}
            onChange={handleFilterChange}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="">All verification statuses</option>
            <option value="not_submitted">Not submitted</option>
            <option value="pending_review">Pending review</option>
            <option value="under_review">Under review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Apply filters
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Clear filters
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Property listings
          </h2>
          <span className="text-sm text-gray-500">
            {pagination.total.toLocaleString()} results
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading properties...
          </div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={34} className="mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-700">
              No properties found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filter options.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Property</th>
                    <th className="px-5 py-4">Owner</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Listing status</th>
                    <th className="px-5 py-4">Verification</th>
                    <th className="px-5 py-4">Date added</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {properties.map(property => {
                    const location = property.location || {};
                    const owner = property.owner || {};
                    const frequency = formatPriceFrequency(property);

                    return (
                      <tr key={property._id} className="transition hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {property.title}
                          </p>
                          <p className="mt-1 text-xs capitalize text-gray-500">
                            {property.propertyType} · {property.transactionType}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {[location.area, location.city, location.state]
                              .filter(Boolean)
                              .join(", ") || "Location unavailable"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">
                            {[owner.firstName, owner.lastName]
                              .filter(Boolean)
                              .join(" ") || "Unknown owner"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {owner.email || "No email available"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-800">
                          {formatPrice(property.price, property.currency)}
                          {frequency && (
                            <p className="mt-1 text-xs font-normal text-gray-500">
                              {frequency}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge value={property.status} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge value={property.verificationStatus} />
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                          {property.createdAt
                            ? new Date(property.createdAt).toLocaleDateString("en-NG")
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          {renderActions(property)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages || 1}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => fetchProperties(pagination.page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => fetchProperties(pagination.page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

