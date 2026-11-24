
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  Clock3,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Video,
  AlertCircle,
  ClipboardCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getMediaCounts(property) {
  const media = Array.isArray(property.media) ? property.media : [];

  return {
    images: media.filter((item) => item.type === "image").length,
    videos: media.filter((item) => item.type === "video").length
  };
}

function getOwnerName(owner) {
  if (!owner) return "Unknown owner";

  return `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
    || owner.email
    || "Unknown owner";
}

function ReviewPropertyCard({ property }) {
  const { images, videos } = getMediaCounts(property);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr]">
        <div className="h-40 overflow-hidden rounded-xl bg-gray-100">
          {property.coverImage ? (
            <img
              src={property.coverImage}
              alt={property.title || "Property"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <Building2 size={42} />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                Awaiting review
              </span>

              <h2 className="mt-3 text-lg font-bold text-gray-900">
                {property.title || "Untitled property"}
              </h2>
            </div>

            <span className="text-xs text-gray-500">
              Submitted {formatDate(property.createdAt)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} />
              {[property.location?.area, property.location?.city, property.location?.state]
                .filter(Boolean)
                .join(", ") || "Location unavailable"}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={15} />
              {formatDate(property.createdAt)}
            </span>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Submitted by: <span className="font-semibold text-gray-800">
              {getOwnerName(property.owner)}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon size={16} />
                {images} images
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Video size={16} />
                {videos} videos
              </span>
            </div>

            <Link
              to={`/admin/property-reviews/${property._id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#159447] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <Eye size={16} />
              Inspect property
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AdminPropertyReviews() {
  const { token } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProperties = useCallback(async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      setError("Your admin session is unavailable. Please sign in again.");
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.getPendingProperties(token);
      setProperties(response.data || []);
    } catch (err) {
      setError(err.message || "Unable to load property submissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1769AA]">
            <ClipboardCheck size={18} />
            Property management
          </div>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Property reviews
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Inspect submitted properties before approving publication.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadProperties(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">
          Submissions awaiting administrative review
        </p>

        <p className="mt-2 text-3xl font-bold text-gray-900">
          {loading ? "—" : properties.length}
        </p>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-16">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-[#159447]" />
            <p className="mt-4 text-sm text-gray-500">
              Loading property submissions...
            </p>
          </div>
        </div>
      ) : properties.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center">
          <ClipboardCheck size={42} className="mx-auto text-gray-300" />

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            No properties awaiting review
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            New property submissions will appear here when they are sent for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <ReviewPropertyCard
              key={property._id}
              property={property}
            />
          ))}
        </div>
      )}
    </div>
  );
}
