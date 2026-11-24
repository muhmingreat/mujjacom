
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  MapPin,
  Plus,
  RefreshCw,
  Clock3,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Video,
  Building2,
  Eye,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";

const propertyStatus = {
  draft: "Unpublished",
  published: "Published",
  reserved: "Reserved",
  sold: "Sold",
  leased: "Leased",
  rented: "Rented",
  archived: "Archived",
};

const reviewStatus = {
  not_submitted: "Not submitted",
  pending_review: "Awaiting review",
  under_review: "Under review",
  verified: "Platform review marked verified",
  rejected: "Review not approved",
};

const statusStyles = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  sold: "bg-blue-100 text-blue-800",
  leased: "bg-purple-100 text-purple-800",
  rented: "bg-indigo-100 text-indigo-800",
  archived: "bg-gray-100 text-gray-600",
};

function formatPrice(price, currency = "NGN") {
  if (price === undefined || price === null || price === "") {
    return "Price on request";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${Number(price).toLocaleString("en-NG")}`;
  }
}

function getPropertyImages(property) {
  const mediaImages = Array.isArray(property.media)
    ? property.media
        .filter((item) => item?.type === "image" && item?.url)
        .map((item) => item.url)
    : [];

  const images = [...mediaImages];

  if (property.coverImage && !images.includes(property.coverImage)) {
    images.unshift(property.coverImage);
  }

  return [...new Set(images)];
}

function getPropertyVideos(property) {
  if (!Array.isArray(property.media)) return [];

  return property.media.filter(
    (item) => item?.type === "video" && item?.url
  );
}

function formatDate(date) {
  if (!date) return "Unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unavailable";
  }

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MediaGallery({ property }) {
  const images = getPropertyImages(property);
  const videos = getPropertyVideos(property);

  return (
    <section className="mt-6 border-t border-gray-100 pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">
            Property media
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Photos and videos uploaded for this property.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <ImageIcon size={14} />
            {images.length} photos
          </span>

          <span className="flex items-center gap-1">
            <Video size={14} />
            {videos.length} videos
          </span>
        </div>
      </div>

      {images.length === 0 && videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
          <ImageIcon
            size={28}
            className="mx-auto text-gray-400"
          />
          <p className="mt-3 text-sm font-medium text-gray-600">
            No property photos or videos available.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {images.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImageIcon size={16} />
                Property photos
              </h4>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((image, index) => (
                  <a
                    key={`${image}-${index}`}
                    href={image}
                    target="_blank"
                    rel="noreferrer"
                    className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${
                      index === 0
                        ? "col-span-2 row-span-2"
                        : ""
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${property.title} - Photo ${index + 1}`}
                      loading="lazy"
                      className={`w-full object-cover transition duration-300 group-hover:scale-105 ${
                        index === 0
                          ? "h-56 sm:h-64"
                          : "h-32 sm:h-36"
                      }`}
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                      <Eye
                        size={22}
                        className="text-white opacity-0 transition group-hover:opacity-100"
                      />
                    </div>

                    {index === 0 && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-green-700 px-3 py-1 text-xs font-semibold text-white">
                        Cover photo
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Video size={16} />
                Property videos
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((video, index) => (
                  <div
                    key={`${video.url}-${index}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950"
                  >
                    <video
                      src={video.url}
                      controls
                      preload="metadata"
                      playsInline
                      className="aspect-video w-full"
                    >
                      Your browser does not support video playback.
                    </video>

                    <div className="bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">
                        Property video {index + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PropertyCard({
  property,
  deleting,
  onDelete,
}) {
  const images = getPropertyImages(property);
  const location = [
    property.location?.area,
    property.location?.city,
    property.location?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:shadow-md">
      <div className="grid md:grid-cols-[280px_1fr]">
        <div className="relative min-h-52 bg-gray-100 md:min-h-full">
          {images.length > 0 ? (
            <img
              src={images[0]}
              alt={property.title}
              loading="lazy"
              className="h-56 w-full object-cover md:h-full"
            />
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-gray-400 md:h-full">
              <Building2 size={42} />
              <span className="mt-3 text-sm">
                No cover image
              </span>
            </div>
          )}

          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
            {images.length} photos
          </span>

          {getPropertyVideos(property).length > 0 && (
            <span className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white">
              <Video size={13} />
              {getPropertyVideos(property).length} videos
            </span>
          )}
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                {property.title}
              </h2>

              <p className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                <MapPin
                  size={16}
                  className="mt-0.5 shrink-0"
                />
                {location || "Location not specified"}
              </p>

              <p className="mt-4 text-xl font-bold text-green-800">
                {formatPrice(property.price, property.currency)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyles[property.status] ||
                  "bg-gray-100 text-gray-700"
                }`}
              >
                {propertyStatus[property.status] ||
                  property.status ||
                  "Unknown"}
              </span>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                {reviewStatus[property.verificationStatus] ||
                  "Review status unavailable"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">
                Property type
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                {property.propertyType || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Listing type
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-gray-800">
                {property.transactionType || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Date created
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-gray-800">
                <Clock3 size={14} />
                {formatDate(property.createdAt)}
              </p>
            </div>
          </div>

          {property.status === "published" && (
            <div className="mt-5 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 size={17} />
              This property is published on the platform.
            </div>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <MediaGallery property={property} />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
        <Link
          to={`/dashboard/my-properties/${property._id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border border-green-700 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
        >
          <Pencil size={16} />
          Edit property
        </Link>

        <button
          type="button"
          onClick={() => onDelete(property._id, property.title)}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Delete property
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default function MyPropertiesPage() {
  const { token } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadProperties = useCallback(async () => {
    if (!token) {
      setError("Please sign in to view your properties.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.getMyProperties(token);
      setProperties(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(err.message || "Unable to load your properties.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  async function handleDeleteProperty(propertyId, propertyTitle) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(propertyId);
      setError("");
      setSuccessMessage("");

      await api.deleteMyProperty(propertyId, token);

      setProperties((current) =>
        current.filter((property) => property._id !== propertyId)
      );

      setSuccessMessage("Property deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete this property.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Property management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            My Properties
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your property listings, photos, videos and submission status.
          </p>
        </div>

        <Link
          to="/sell-property"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          <Plus size={18} />
          Submit a property
        </Link>
      </div>

      {/* Platform notice */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <p className="text-sm leading-6 text-blue-900">
            Platform review statuses describe Amanah Estates' internal review
            process. They do not replace independent legal checks, title
            verification or professional property due diligence.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={19} />
          {successMessage}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <p className="text-sm text-red-700">{error}</p>

          {!loading && (
            <button
              type="button"
              onClick={loadProperties}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 text-gray-600">
          <RefreshCw size={20} className="animate-spin" />
          Loading your properties...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && properties.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <Home size={30} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            No properties submitted yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Properties you submit through Amanah Estates will appear here,
            together with their photos, videos, publication and review statuses.
          </p>

          <Link
            to="/sell-property"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            <Plus size={18} />
            Submit your first property
          </Link>
        </div>
      )}

      {/* Property list */}
      {!loading && !error && properties.length > 0 && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-600">
              {properties.length}{" "}
              {properties.length === 1 ? "property" : "properties"} found
            </p>

            <button
              type="button"
              onClick={loadProperties}
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-900"
            >
              <RefreshCw size={15} />
              Refresh properties
            </button>
          </div>

          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              deleting={deletingId === property._id}
              onDelete={handleDeleteProperty}
            />
          ))}
        </div>
      )}
    </div>
  );
}
