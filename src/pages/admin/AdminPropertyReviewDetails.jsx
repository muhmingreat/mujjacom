
import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  BedDouble,
  Bath,
  Ruler,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  CalendarDays,
  ShieldCheck,
  Clock,
  Home,
  FileText,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";

function formatPrice(price, currency = "NGN") {
  if (price === undefined || price === null || price === "") {
    return "Price not specified";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(price));
  } catch {
    return `${currency} ${Number(price).toLocaleString("en-NG")}`;
  }
}

function formatDate(date) {
  if (!date) return "Unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unavailable";
  }

  return parsedDate.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function humanize(value) {
  if (!value) return "Not specified";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPriceFrequencyLabel(transactionType, frequency) {
  if (!["rent", "lease"].includes(transactionType)) {
    return "One-time payment";
  }

  if (!frequency) return "Frequency not specified";

  const labels = {
    monthly: "Per month",
    quarterly: "Per quarter",
    biannually: "Every six months",
    annually: "Per year",
    one_time: "One-time payment",
  };

  return labels[frequency] || humanize(frequency);
}

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className="text-[#159447]" />}
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-gray-800">
        {value === undefined || value === null || value === ""
          ? "Not provided"
          : value}
      </p>
    </div>
  );
}

function StatusBadge({ status, type = "neutral" }) {
  const palettes = {
    success: "bg-green-50 text-green-700 border-green-100",
    danger: "bg-red-50 text-red-700 border-red-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    info: "bg-blue-50 text-blue-700 border-blue-100",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
        palettes[type] || palettes.neutral
      }`}
    >
      {humanize(status)}
    </span>
  );
}

function getVerificationType(status) {
  if (status === "verified") return "success";
  if (status === "rejected") return "danger";
  if (["pending_review", "under_review"].includes(status)) return "warning";

  return "neutral";
}

function getListingType(status) {
  if (status === "published") return "success";
  if (["sold", "leased", "rented"].includes(status)) return "info";
  if (status === "archived") return "neutral";
  if (status === "reserved") return "warning";

  return "neutral";
}

function MediaSection({ media = [] }) {
  const images = media.filter(
    (item) => item.type === "image" && item.url
  );

  const videos = media.filter(
    (item) => item.type === "video" && item.url
  );

  return (
    <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <div className="flex items-center gap-2">
          <Building2 size={19} className="text-[#159447]" />
          <h2 className="text-lg font-bold text-gray-900">
            Property media
          </h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Inspect the photographs and videos submitted with this property.
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon size={19} className="text-[#159447]" />
            <h3 className="font-semibold text-gray-900">Photographs</h3>
          </div>

          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {images.length} uploaded
          </span>
        </div>

        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <ImageIcon size={26} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No property photographs were uploaded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((item, index) => (
              <a
                key={item.publicId || item.url || index}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group relative overflow-hidden rounded-xl bg-gray-100"
              >
                <img
                  src={item.url}
                  alt={`Property photograph ${index + 1}`}
                  loading="lazy"
                  className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                  Image {index + 1}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Video size={19} className="text-[#1769AA]" />
            <h3 className="font-semibold text-gray-900">Videos</h3>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {videos.length} uploaded
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <Video size={26} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No property videos were uploaded.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((item, index) => (
              <div
                key={item.publicId || item.url || index}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white"
              >
                <video
                  src={item.url}
                  controls
                  preload="metadata"
                  playsInline
                  className="aspect-video w-full bg-black"
                >
                  Your browser does not support video playback.
                </video>

                <p className="px-3 py-2 text-xs font-medium text-gray-600">
                  Property video {index + 1}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminPropertyReviewDetails() {
  const { id } = useParams();
  const routeLocation = useLocation();
  const navigate = useNavigate();

  const { token } = useAuth();

  const fromProperties =
    new URLSearchParams(routeLocation.search).get("from") === "properties";

  const backPath = fromProperties
    ? "/admin/properties"
    : "/admin/property-reviews";

  const backLabel = fromProperties
    ? "Back to all properties"
    : "Back to property reviews";

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");

  const [processing, setProcessing] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const loadProperty = useCallback(async () => {
    if (!token) {
      setError("Your admin session is unavailable. Please sign in again.");
      setLoading(false);
      return;
    }

    if (!id) {
      setError("A property ID was not provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.getAdminProperty(id, token);

      if (!response?.data) {
        throw new Error("The property could not be found.");
      }

      setProperty(response.data);
    } catch (err) {
      setError(err.message || "Unable to load this property.");
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  async function handleApprove() {
    if (!token || !property) return;

    const confirmed = window.confirm(
      "Are you sure you want to approve and publish this property?"
    );

    if (!confirmed) return;

    setProcessing(true);
    setActionError("");
    setSuccess("");

    try {
      const response = await api.approveProperty(id, token);

      setSuccess(
        response.message || "Property approved successfully."
      );

      if (response.data) {
        setProperty(response.data);
      } else {
        await loadProperty();
      }
    } catch (err) {
      setActionError(
        err.message || "Unable to approve this property."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(event) {
    event.preventDefault();

    if (!token || !property) return;

    if (!reviewNote.trim()) {
      setActionError(
        "Please provide a reason for rejecting this property."
      );
      return;
    }

    setProcessing(true);
    setActionError("");
    setSuccess("");

    try {
      const response = await api.rejectProperty(
        id,
        reviewNote.trim(),
        token
      );

      setSuccess(
        response.message || "Property rejected successfully."
      );

      if (response.data) {
        setProperty(response.data);
      } else {
        await loadProperty();
      }

      setShowRejectForm(false);
      setReviewNote("");
    } catch (err) {
      setActionError(
        err.message || "Unable to reject this property."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-[#159447]" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading property details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <div className="flex items-center gap-2 font-semibold text-red-700">
          <AlertCircle size={20} />
          Unable to display property
        </div>

        <p className="mt-2 text-sm text-red-600">
          {error || "The requested property could not be found."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadProperty}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <RefreshCw size={16} />
            Try again
          </button>

          <Link
            to={backPath}
            className="rounded-xl bg-[#159447] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const location = property.location || {};
  const owner = property.owner || {};
  const media = Array.isArray(property.media) ? property.media : [];

  const images = media.filter((item) => item.type === "image");
  const videos = media.filter((item) => item.type === "video");

  const imagesCount = images.length;
  const videosCount = videos.length;

  const awaitingReview = [
    "pending_review",
    "under_review",
  ].includes(property.verificationStatus);

  const hasRequiredMedia =
    imagesCount >= 5 && videosCount >= 2;

  const ownerName =
    [owner.firstName, owner.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown owner";

  const propertyAddress = [
    location.address,
    location.area,
    location.city,
    location.state,
  ]
    .filter(Boolean)
    .join(", ");

  const priceFrequency = getPriceFrequencyLabel(
    property.transactionType,
    property.priceFrequency
  );

  return (
    <div className="space-y-7">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#159447]"
        >
          <ArrowLeft size={17} />
          {backLabel}
        </Link>

        <span className="text-xs text-gray-400">
          Property ID: {property._id || id}
        </span>
      </div>

      {/* Header */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1769AA]">
                <ShieldCheck size={15} />
                Administrative inspection
              </span>

              <StatusBadge
                status={property.verificationStatus || "not_submitted"}
                type={getVerificationType(property.verificationStatus)}
              />
            </div>

            <h1 className="mt-4 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
              {property.title}
            </h1>

            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-gray-500">
              <MapPin size={17} className="mt-0.5 shrink-0 text-[#159447]" />
              {propertyAddress || "Location not provided"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={property.status || "draft"}
              type={getListingType(property.status)}
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{actionError}</p>
        </div>
      )}

      {/* Main content */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* Property information */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Building2 size={19} className="text-[#159447]" />
              <h2 className="text-lg font-bold text-gray-900">
                Property information
              </h2>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Description
              </p>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
                {property.description || "No description provided."}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Property type"
                value={humanize(property.propertyType)}
                icon={Home}
              />

              <DetailItem
                label="Transaction type"
                value={humanize(property.transactionType)}
              />

              <DetailItem
                label="Price"
                value={formatPrice(
                  property.price,
                  property.currency
                )}
              />

              <DetailItem
                label="Payment frequency"
                value={priceFrequency}
              />

              <DetailItem
                label="Development status"
                value={humanize(property.developmentStatus)}
              />

              <DetailItem
                label="Land size"
                value={
                  property.landSize?.value
                    ? `${property.landSize.value} ${
                        property.landSize.unit || ""
                      }`
                    : "Not provided"
                }
                icon={Ruler}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <DetailItem
                label="Bedrooms"
                value={property.bedrooms ?? "Not specified"}
                icon={BedDouble}
              />

              <DetailItem
                label="Bathrooms"
                value={property.bathrooms ?? "Not specified"}
                icon={Bath}
              />

              <DetailItem
                label="Date submitted"
                value={formatDate(property.createdAt)}
                icon={CalendarDays}
              />
            </div>

            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Property features
              </p>

              {Array.isArray(property.features) &&
              property.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, index) => (
                    <span
                      key={`${feature}-${index}`}
                      className="rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No additional features provided.
                </p>
              )}
            </div>
          </section>

          {/* Media */}
          <MediaSection media={media} />

          {/* Location */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <MapPin size={19} className="text-[#159447]" />
              <h2 className="text-lg font-bold text-gray-900">
                Property location
              </h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Street address"
                value={location.address}
              />

              <DetailItem
                label="Area / neighbourhood"
                value={location.area}
              />

              <DetailItem
                label="City"
                value={location.city}
              />

              <DetailItem
                label="State"
                value={location.state}
              />

              <DetailItem
                label="Country"
                value={location.country}
              />
            </div>

            {location.coordinates?.latitude != null &&
              location.coordinates?.longitude != null && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Coordinates
                  </p>

                  <p className="mt-2 text-sm font-medium text-gray-700">
                    Latitude: {location.coordinates.latitude}
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    Longitude: {location.coordinates.longitude}
                  </p>
                </div>
              )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Owner */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">
              Property owner
            </h2>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#159447]">
                <User size={23} />
              </div>

              <div className="min-w-0">
                <p className="break-words font-semibold text-gray-900">
                  {ownerName}
                </p>

                <p className="text-xs text-gray-500">
                  Property submitter
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm text-gray-600">
              {owner.email ? (
                <a
                  href={`mailto:${owner.email}`}
                  className="flex items-start gap-2 break-all transition hover:text-[#159447]"
                >
                  <Mail size={16} className="mt-0.5 shrink-0" />
                  {owner.email}
                </a>
              ) : (
                <p className="text-xs text-gray-400">
                  Email not available
                </p>
              )}

              {owner.phone ? (
                <a
                  href={`tel:${owner.phone}`}
                  className="flex items-center gap-2 transition hover:text-[#159447]"
                >
                  <Phone size={16} className="shrink-0" />
                  {owner.phone}
                </a>
              ) : (
                <p className="text-xs text-gray-400">
                  Phone number not available
                </p>
              )}
            </div>
          </section>

          {/* Media requirements */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">
              Media requirements
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              The current approval policy requires at least five images
              and two videos.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <ImageIcon size={17} />
                    Images
                  </span>

                  <span
                    className={
                      imagesCount >= 5
                        ? "font-semibold text-green-700"
                        : "font-semibold text-red-600"
                    }
                  >
                    {imagesCount} / 5
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      imagesCount >= 5
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (imagesCount / 5) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Video size={17} />
                    Videos
                  </span>

                  <span
                    className={
                      videosCount >= 2
                        ? "font-semibold text-green-700"
                        : "font-semibold text-red-600"
                    }
                  >
                    {videosCount} / 2
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      videosCount >= 2
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (videosCount / 2) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`mt-5 flex items-start gap-2 rounded-xl p-3 text-xs leading-5 ${
                hasRequiredMedia
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {hasRequiredMedia ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              )}

              <p>
                {hasRequiredMedia
                  ? "Minimum media count has been met. The content must still be inspected."
                  : "The minimum media requirement has not been met. Approval is unavailable."}
              </p>
            </div>
          </section>

          {/* Review decision */}
          {awaitingReview ? (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={19} className="text-[#159447]" />
                <h2 className="font-bold text-gray-900">
                  Verification decision
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Inspect the property information, ownership details
                and uploaded media before making a decision.
              </p>

              <button
                type="button"
                onClick={handleApprove}
                disabled={processing || !hasRequiredMedia}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#159447] px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={18} />

                {processing
                  ? "Processing..."
                  : "Approve and publish"}
              </button>

              {!hasRequiredMedia && (
                <p className="mt-2 text-xs text-red-600">
                  Required media is incomplete. Approval is disabled.
                </p>
              )}

              {!showRejectForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(true);
                    setActionError("");
                  }}
                  disabled={processing}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={18} />
                  Reject submission
                </button>
              ) : (
                <form
                  onSubmit={handleReject}
                  className="mt-5 space-y-3"
                >
                  <label
                    htmlFor="reviewNote"
                    className="block text-sm font-semibold text-gray-800"
                  >
                    Reason for rejection
                  </label>

                  <textarea
                    id="reviewNote"
                    value={reviewNote}
                    onChange={(event) =>
                      setReviewNote(event.target.value)
                    }
                    rows={5}
                    maxLength={2000}
                    required
                    placeholder="Explain what needs to be corrected..."
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-[#159447] focus:ring-2 focus:ring-green-100"
                  />

                  <p className="text-right text-xs text-gray-400">
                    {reviewNote.length}/2000
                  </p>

                  <button
                    type="submit"
                    disabled={processing || !reviewNote.trim()}
                    className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing
                      ? "Processing..."
                      : "Confirm rejection"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setActionError("");
                    }}
                    disabled={processing}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                {property.verificationStatus === "verified" ? (
                  <CheckCircle2
                    size={19}
                    className="text-green-600"
                  />
                ) : property.verificationStatus === "rejected" ? (
                  <XCircle size={19} className="text-red-600" />
                ) : (
                  <Clock size={19} className="text-gray-500" />
                )}

                <h2 className="font-bold text-gray-900">
                  Verification information
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Current verification status:{" "}
                <span className="font-semibold text-gray-700">
                  {humanize(property.verificationStatus)}
                </span>
              </p>

              {property.reviewNote && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">
                    Review note
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-red-600">
                    {property.reviewNote}
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-400">
                    Reviewed by
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {property.reviewedBy
                      ? typeof property.reviewedBy === "object"
                        ? [
                            property.reviewedBy.firstName,
                            property.reviewedBy.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ") || "Administrator"
                        : "Administrator"
                      : "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Review date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {formatDate(property.reviewedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Published date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {formatDate(property.publishedAt)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Record information */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-gray-500" />
              <h2 className="font-bold text-gray-900">
                Record information
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700">
                  {formatDate(property.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Last updated
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700">
                  {formatDate(property.updatedAt)}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="flex justify-start border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#159447] hover:text-[#159447]"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>
      </div>
    </div>
  );
}

