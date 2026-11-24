
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Video,
  X,
  UploadCloud,
  MapPin,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";

const initialForm = {
  title: "",
  description: "",
  propertyType: "house",
  transactionType: "sale",
  price: "",
  priceFrequency: "one_time",
  address: "",
  area: "",
  city: "",
  state: "",
  landSize: "",
  bedrooms: "",
  bathrooms: "",
  features: "",
};

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/x-msvideo",
  "video/avi",
];

const recurringFrequencies = [
  "monthly",
  "quarterly",
  "biannually",
  "annually",
];

const MAX_IMAGES = 10;
const MAX_VIDEOS = 3;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function toInputValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function getPropertyImages(property) {
  const mediaImages = Array.isArray(property?.media)
    ? property.media.filter(
        (item) => item?.type === "image" && item?.url,
      )
    : [];

  const images = [...mediaImages];

  if (
    property?.coverImage &&
    !images.some((image) => image.url === property.coverImage)
  ) {
    images.unshift({
      url: property.coverImage,
      type: "image",
    });
  }

  return images;
}

function getPropertyVideos(property) {
  return Array.isArray(property?.media)
    ? property.media.filter(
        (item) => item?.type === "video" && item?.url,
      )
    : [];
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [property, setProperty] = useState(null);

  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);

  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const existingImages = getPropertyImages(property);
  const existingVideos = getPropertyVideos(property);

  const totalImages = existingImages.length + imageFiles.length;
  const totalVideos = existingVideos.length + videoFiles.length;

  const loadProperty = useCallback(async () => {
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.getMyProperty(id, token);
      const data = response?.data;

      if (!data) {
        throw new Error("Property information could not be found.");
      }

      setProperty(data);

      const transactionType = data.transactionType || "sale";

      setForm({
        title: toInputValue(data.title),
        description: toInputValue(data.description),
        propertyType: data.propertyType || "house",
        transactionType,
        price: toInputValue(data.price),
        priceFrequency:
          data.priceFrequency ||
          (transactionType === "sale" ? "one_time" : "monthly"),
        address: toInputValue(data.location?.address),
        area: toInputValue(data.location?.area),
        city: toInputValue(data.location?.city),
        state: toInputValue(data.location?.state),
        landSize: toInputValue(data.landSize?.value),
        bedrooms: toInputValue(data.bedrooms),
        bathrooms: toInputValue(data.bathrooms),
        features: Array.isArray(data.features)
          ? data.features.join(", ")
          : "",
      });
    } catch (err) {
      setError(err.message || "Unable to load this property.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  useEffect(() => {
    const previews = imageFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImagePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imageFiles]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      if (name === "transactionType") {
        updated.priceFrequency =
          value === "sale" ? "one_time" : "monthly";
      }

      return updated;
    });
  }

  function handleImageSelection(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    setError("");
    setSuccess("");

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      if (
        !allowedImageTypes.includes(file.type) ||
        file.size > MAX_IMAGE_SIZE
      ) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    const availableSlots = Math.max(0, MAX_IMAGES - totalImages);
    const filesToAdd = validFiles.slice(0, availableSlots);

    if (filesToAdd.length) {
      setImageFiles((current) => [...current, ...filesToAdd]);
    }

    if (invalidFiles.length) {
      setError(
        "Some images were skipped. Use JPG, PNG or WebP files up to 10 MB each.",
      );
    } else if (validFiles.length > availableSlots) {
      setError(
        `You can only have ${MAX_IMAGES} images in total. Remove an existing image or a selected image before adding more.`,
      );
    }
  }

  function handleVideoSelection(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    setError("");
    setSuccess("");

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      if (
        !allowedVideoTypes.includes(file.type) ||
        file.size > MAX_VIDEO_SIZE
      ) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    const availableSlots = Math.max(0, MAX_VIDEOS - totalVideos);
    const filesToAdd = validFiles.slice(0, availableSlots);

    if (filesToAdd.length) {
      setVideoFiles((current) => [...current, ...filesToAdd]);
    }

    if (invalidFiles.length) {
      setError(
        "Some videos were skipped. Use MP4, WebM, MOV, M4V or AVI files up to 100 MB each.",
      );
    } else if (validFiles.length > availableSlots) {
      setError(
        `You can only have ${MAX_VIDEOS} videos in total. Remove an existing video or a selected video before adding more.`,
      );
    }
  }

  function removeSelectedImage(index) {
    setImageFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  function removeSelectedVideo(index) {
    setVideoFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.city.trim() || !form.state.trim()) {
      setError("Please complete the property title, city and state.");
      return;
    }

    if (totalImages > MAX_IMAGES) {
      setError(`A property cannot have more than ${MAX_IMAGES} images.`);
      return;
    }

    if (totalVideos > MAX_VIDEOS) {
      setError(`A property cannot have more than ${MAX_VIDEOS} videos.`);
      return;
    }

    const numericFields = [
      { value: form.price, label: "property price" },
      { value: form.landSize, label: "land size" },
      { value: form.bedrooms, label: "bedrooms" },
      { value: form.bathrooms, label: "bathrooms" },
    ];

    for (const field of numericFields) {
      const value = String(field.value ?? "").trim();

      if (
        value !== "" &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
      ) {
        setError(`Please enter a valid ${field.label}.`);
        return;
      }
    }

    if (
      String(form.bedrooms).trim() !== "" &&
      !Number.isInteger(Number(form.bedrooms))
    ) {
      setError("Bedrooms must be a whole number.");
      return;
    }

    if (
      String(form.bathrooms).trim() !== "" &&
      !Number.isInteger(Number(form.bathrooms))
    ) {
      setError("Bathrooms must be a whole number.");
      return;
    }

    const expectedFrequency =
      form.transactionType === "sale"
        ? "one_time"
        : form.priceFrequency;

    if (
      form.transactionType === "sale" &&
      expectedFrequency !== "one_time"
    ) {
      setError("Properties for sale must use one-time payment.");
      return;
    }

    if (
      ["rent", "lease"].includes(form.transactionType) &&
      !recurringFrequencies.includes(expectedFrequency)
    ) {
      setError("Please select a valid rent or lease payment frequency.");
      return;
    }

    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      propertyType: form.propertyType,
      transactionType: form.transactionType,
      priceFrequency: expectedFrequency,
      currency: "NGN",

      price: String(form.price).trim()
        ? Number(form.price)
        : null,

      location: {
        address: form.address.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: "Nigeria",
      },

      landSize: String(form.landSize).trim()
        ? {
            value: Number(form.landSize),
            unit: "sqm",
          }
        : null,

      bedrooms: String(form.bedrooms).trim()
        ? Number(form.bedrooms)
        : null,

      bathrooms: String(form.bathrooms).trim()
        ? Number(form.bathrooms)
        : null,

      features: form.features
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      setSaving(true);

      await api.updateMyProperty(id, payload, token);

      if (imageFiles.length > 0) {
        await api.uploadPropertyImages(id, imageFiles, token);
        setImageFiles([]);
      }

      if (videoFiles.length > 0) {
        await api.uploadPropertyVideos(id, videoFiles, token);
        setVideoFiles([]);
      }

      await loadProperty();

      setSuccess(
        "Your property information and media have been saved successfully.",
      );
    } catch (err) {
      setError(
        `${err.message || "Unable to complete the update."} Your property details may already have been saved. Check the media section before retrying uploads.`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 text-gray-600">
        <RefreshCw className="animate-spin" size={20} />
        Loading property information...
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 text-red-600" size={20} />

          <div>
            <h2 className="font-bold text-gray-900">
              Unable to open property
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadProperty}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              <RefreshCw size={16} />
              Try again
            </button>

            <Link
              to="/dashboard/my-properties"
              className="ml-4 text-sm font-semibold text-green-700 hover:underline"
            >
              Back to My Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/my-properties"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900"
        >
          <ArrowLeft size={17} />
          Back to My Properties
        </Link>

        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-green-700">
          Property management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Edit Property
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Update your property details, photos and videos.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => navigate("/dashboard/my-properties")}
            className="ml-auto shrink-0 font-semibold underline"
          >
            View properties
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <section>
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Basic property information
          </h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Property title *
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className={inputClass}
                maxLength={160}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Property type *
                </label>

                <select
                  name="propertyType"
                  value={form.propertyType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="land">Land</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="commercial">Commercial</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Transaction type *
                </label>

                <select
                  name="transactionType"
                  value={form.transactionType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="sale">For sale</option>
                  <option value="rent">For rent</option>
                  <option value="lease">For lease</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={inputClass}
                rows={5}
                maxLength={10000}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Price (NGN)
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  step="any"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {form.transactionType === "sale"
                    ? "Payment frequency"
                    : "Rent / Lease payment frequency *"}
                </label>

                {form.transactionType === "sale" ? (
                  <input
                    value="One-time payment"
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-600`}
                  />
                ) : (
                  <select
                    name="priceFrequency"
                    value={form.priceFrequency}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="biannually">Every 6 months</option>
                    <option value="annually">Annually</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-7">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-gray-900">
            <MapPin size={20} className="text-green-700" />
            Property location
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Street address
              </label>

              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Area
              </label>

              <input
                name="area"
                value={form.area}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                City *
              </label>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                State *
              </label>

              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-7">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Additional details
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Land size (sqm)
              </label>

              <input
                type="number"
                name="landSize"
                value={form.landSize}
                onChange={handleChange}
                className={inputClass}
                min="0"
                step="any"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Bedrooms
              </label>

              <input
                type="number"
                name="bedrooms"
                value={form.bedrooms}
                onChange={handleChange}
                className={inputClass}
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Bathrooms
              </label>

              <input
                type="number"
                name="bathrooms"
                value={form.bathrooms}
                onChange={handleChange}
                className={inputClass}
                min="0"
                step="1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Features
              </label>

              <input
                name="features"
                value={form.features}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. Security, parking, swimming pool"
              />

              <p className="mt-2 text-xs text-gray-500">
                Separate each feature with a comma.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <ImagePlus size={21} className="text-green-700" />
                Property photos
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your current photos and any new photos you select.
              </p>
            </div>

            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800">
              {totalImages}/{MAX_IMAGES} images
            </span>
          </div>

          {existingImages.length > 0 ? (
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Existing uploaded photos
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {existingImages.map((image, index) => (
                  <a
                    key={`${image.url}-${index}`}
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                  >
                    <img
                      src={image.url}
                      alt={`Existing property photo ${index + 1}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                      Uploaded
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
              No existing photos have been uploaded.
            </p>
          )}

          <div className="mt-5 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/60 p-5 transition hover:border-green-400">
            <label className="flex cursor-pointer flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <UploadCloud size={25} />
              </span>

              <span className="mt-3 text-sm font-bold text-gray-900">
                Add more property photos
              </span>

              <span className="mt-1 text-xs text-gray-500">
                JPG, PNG or WebP · Maximum 10 MB per image
              </span>

              <span className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white">
                Choose images
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelection}
                disabled={totalImages >= MAX_IMAGES || saving}
                className="sr-only"
              />
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                New photos selected
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={`${preview.file.name}-${index}`}
                    className="relative overflow-hidden rounded-xl border border-green-200 bg-white"
                  >
                    <div className="aspect-[4/3]">
                      <img
                        src={preview.url}
                        alt={preview.file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-2">
                      <p className="truncate text-xs font-semibold text-gray-700">
                        {preview.file.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {formatFileSize(preview.file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSelectedImage(index)}
                      disabled={saving}
                      aria-label={`Remove ${preview.file.name}`}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow transition hover:bg-red-700 disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="border-t border-gray-200 pt-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Video size={21} className="text-blue-700" />
                Property videos
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View existing videos or add new property videos.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
              {totalVideos}/{MAX_VIDEOS} videos
            </span>
          </div>

          {existingVideos.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {existingVideos.map((video, index) => (
                <div
                  key={`${video.url}-${index}`}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                >
                  <video
                    src={video.url}
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-black"
                  />

                  <p className="p-3 text-xs font-semibold text-gray-600">
                    Existing property video {index + 1}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
              No existing videos have been uploaded.
            </p>
          )}

          <div className="mt-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-5 transition hover:border-blue-400">
            <label className="flex cursor-pointer flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Video size={25} />
              </span>

              <span className="mt-3 text-sm font-bold text-gray-900">
                Add more property videos
              </span>

              <span className="mt-1 text-xs text-gray-500">
                MP4, WebM, MOV, M4V or AVI · Maximum 100 MB per video
              </span>

              <span className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white">
                Choose videos
              </span>

              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/avi"
                multiple
                onChange={handleVideoSelection}
                disabled={totalVideos >= MAX_VIDEOS || saving}
                className="sr-only"
              />
            </label>
          </div>

          {videoFiles.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                New videos selected
              </p>

              {videoFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Video size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSelectedVideo(index)}
                    disabled={saving}
                    aria-label={`Remove ${file.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          Ownership, publication and platform review statuses cannot be changed
          through this form. Existing uploaded media is displayed here, but
          removing stored media requires a separate server-side deletion
          feature.
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Saving property and media...
            </>
          ) : (
            <>
              <Save size={18} />
              Save property changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
