import { Link } from "react-router-dom";
import {
  Sparkles,
  Send,
  Handshake,
  LayoutDashboard,
  LockKeyhole,
  ImagePlus,
  Video,
  X,
  UploadCloud,
  CheckCircle2,
  MapPin,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";


export function SellPropertyPage() {
  const { token, user } = useAuth();

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

  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
    "video/x-msvideo",
    "video/avi",
  ];

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Generate and clean up image preview URLs.
  useEffect(() => {
    const previews = images.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImagePreviews(previews);

    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [images]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      if (name === "transactionType" && value === "sale") {
        updated.priceFrequency = "one_time";
      }

      if (name === "transactionType" && value !== "sale") {
        if (current.priceFrequency === "one_time") {
          updated.priceFrequency = "monthly";
        }
      }

      return updated;
    });

    setError("");
  }

  function handleImageChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    const remainingSlots = Math.max(0, 10 - images.length);

    const validFiles = selectedFiles.filter(
      (file) =>
        IMAGE_TYPES.includes(file.type) &&
        file.size <= MAX_IMAGE_SIZE,
    );

    const invalidCount = selectedFiles.length - validFiles.length;

    if (invalidCount > 0) {
      setError(
        "Some images were rejected. Use JPG, PNG or WebP files no larger than 10 MB each.",
      );
    } else {
      setError("");
    }

    if (validFiles.length > remainingSlots) {
      setError(
        `You can select only ${remainingSlots} more image(s). The maximum is 10.`,
      );
    }

    setImages((current) => [
      ...current,
      ...validFiles.slice(0, remainingSlots),
    ]);

    event.target.value = "";
  }

  function handleVideoChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    const remainingSlots = Math.max(0, 3 - videos.length);

    const validFiles = selectedFiles.filter(
      (file) =>
        VIDEO_TYPES.includes(file.type) &&
        file.size <= MAX_VIDEO_SIZE,
    );

    const invalidCount = selectedFiles.length - validFiles.length;

    if (invalidCount > 0) {
      setError(
        "Some videos were rejected. Use MP4, WebM, MOV, M4V or AVI files no larger than 100 MB each.",
      );
    } else {
      setError("");
    }

    if (validFiles.length > remainingSlots) {
      setError(
        `You can select only ${remainingSlots} more video(s). The maximum is 3.`,
      );
    }

    setVideos((current) => [
      ...current,
      ...validFiles.slice(0, remainingSlots),
    ]);

    event.target.value = "";
  }

  function removeImage(index) {
    setImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );

    setError("");
  }

  function removeVideo(index) {
    setVideos((current) =>
      current.filter((_, videoIndex) => videoIndex !== index),
    );

    setError("");
  }

  function validateNumericField(value, label) {
    if (!value.trim()) return null;

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      return `Please enter a valid ${label}.`;
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (!user?.isEmailVerified) {
      setError("Please verify your email before submitting a property.");
      return;
    }

    if (!token) {
      setError("Please sign in again to continue.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a property title.");
      return;
    }

    if (!form.city.trim() || !form.state.trim()) {
      setError("Please enter the property city and state.");
      return;
    }

    if (images.length < 5 || images.length > 10) {
      setError("Please select at least 5 images and no more than 10 images.");
      return;
    }

    if (videos.length < 2 || videos.length > 3) {
      setError("Please select at least 2 videos and no more than 3 videos.");
      return;
    }

    if (
      form.transactionType === "sale" &&
      form.priceFrequency !== "one_time"
    ) {
      setError("Sale properties must use one-time payment frequency.");
      return;
    }

    if (
      ["rent", "lease"].includes(form.transactionType) &&
      !["monthly", "quarterly", "biannually", "annually"].includes(
        form.priceFrequency,
      )
    ) {
      setError("Please select a valid price frequency.");
      return;
    }

    const priceError = validateNumericField(form.price, "property price");

    if (priceError) {
      setError(priceError);
      return;
    }

    const landSizeError = validateNumericField(form.landSize, "land size");

    if (landSizeError) {
      setError(landSizeError);
      return;
    }

    const bedroomsError = validateNumericField(form.bedrooms, "bedroom count");

    if (bedroomsError) {
      setError(bedroomsError);
      return;
    }

    const bathroomsError = validateNumericField(
      form.bathrooms,
      "bathroom count",
    );

    if (bathroomsError) {
      setError(bathroomsError);
      return;
    }

    const invalidImage = images.find(
      (file) =>
        !IMAGE_TYPES.includes(file.type) ||
        file.size > MAX_IMAGE_SIZE,
    );

    if (invalidImage) {
      setError(
        "Each image must be JPG, PNG or WebP and no larger than 10 MB.",
      );
      return;
    }

    const invalidVideo = videos.find(
      (file) =>
        !VIDEO_TYPES.includes(file.type) ||
        file.size > MAX_VIDEO_SIZE,
    );

    if (invalidVideo) {
      setError(
        "Each video must use a supported format and be no larger than 100 MB.",
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      propertyType: form.propertyType,
      transactionType: form.transactionType,
      priceFrequency:
        form.transactionType === "sale"
          ? "one_time"
          : form.priceFrequency,
      currency: "NGN",
      price: form.price.trim() ? Number(form.price) : undefined,

      location: {
        address: form.address.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: "Nigeria",
      },

      landSize: form.landSize.trim()
        ? {
            value: Number(form.landSize),
            unit: "sqm",
          }
        : undefined,

      bedrooms: form.bedrooms.trim()
        ? Number(form.bedrooms)
        : undefined,

      bathrooms: form.bathrooms.trim()
        ? Number(form.bathrooms)
        : undefined,

      features: form.features
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    setLoading(true);

    try {
      // 1. Create property draft.
      const created = await api.createProperty(payload, token);
      const propertyId = created.data?._id;

      if (!propertyId) {
        throw new Error(
          "Property draft was created, but its ID was not returned.",
        );
      }

      // 2. Upload property images.
      await api.uploadPropertyImages(propertyId, images, token);

      // 3. Upload property videos.
      await api.uploadPropertyVideos(propertyId, videos, token);

      // 4. Submit property for review.
      const submitted = await api.submitMyProperty(propertyId, token);

      setSuccess(
        submitted.message ||
          "Your property has been submitted successfully and is awaiting review.",
      );

      setForm({ ...initialForm });
      setImages([]);
      setVideos([]);
    } catch (err) {
      setError(
        err.message ||
          "Unable to complete your property submission. Your draft may have been saved; check My Properties before trying again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100";

  const sectionTitle =
    "mb-5 flex items-center gap-3 text-xl font-bold text-gray-900";

  return (
    <section className="page-section shell">
      <div className="mx-auto max-w-4xl">
        {/* PAGE INTRODUCTION */}
        <div className="mb-8">
          <span className="eyebrow dark">PROPERTY SUBMISSION</span>

          <h1>
            Submit your property
            <br />
            <em>to Amanah Estates.</em>
          </h1>

          <p className="mt-4 max-w-2xl text-gray-600">
            Provide accurate information about your property. Our team will
            review your submission before it can become publicly available.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <p className="font-semibold">{success}</p>

            <Link
              to="/dashboard/my-properties"
              className="mt-2 inline-block font-semibold underline"
            >
              View my properties
            </Link>
          </div>
        )}

        {/* EMAIL VERIFICATION */}
        {!user?.isEmailVerified && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Your email must be verified before you can submit a property.

            <Link to="/verify-email" className="ml-1 font-semibold underline">
              Verify your email
            </Link>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {/* BASIC INFORMATION */}
          <div>
            <h2 className={sectionTitle}>
              <Building2 className="text-green-700" size={22} />
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
                  placeholder="e.g. Modern 4-bedroom detached house"
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
                    required
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
                    required
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
                  placeholder="Describe the property and its important details..."
                />
              </div>

              {/* PRICE AND FREQUENCY */}
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
                    placeholder="Enter asking price"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Price frequency *
                  </label>

                  {form.transactionType === "sale" ? (
                    <input
                      type="text"
                      value="One-time payment"
                      readOnly
                      className={inputClass}
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
                      <option value="quarterly">Every 3 months</option>
                      <option value="biannually">Every 6 months</option>
                      <option value="annually">Annually</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PROPERTY LOCATION */}
          <div className="border-t border-gray-200 pt-7">
            <h2 className={sectionTitle}>
              <MapPin className="text-green-700" size={22} />
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
                  placeholder="Street or property address"
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
                  placeholder="e.g. Lekki Phase 1"
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
          </div>

          {/* ADDITIONAL DETAILS */}
          <div className="border-t border-gray-200 pt-7">
            <h2 className={sectionTitle}>Additional details</h2>

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
          </div>

          {/* PROPERTY MEDIA */}
          <div className="border-t border-gray-200 pt-7">
            <div className="mb-6">
              <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
                <ImagePlus size={14} />
                Property gallery
              </span>

              <h2 className="mb-2 text-xl font-bold text-gray-900">
                Property images and videos
              </h2>

              <p className="text-sm leading-6 text-gray-600">
                Upload clear, genuine photographs and videos that accurately
                represent your property.
              </p>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="mb-8 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-gray-900">
                    <ImagePlus size={20} className="text-green-700" />
                    Property photographs
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG or WebP · Maximum 10 MB per image
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    images.length >= 5
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {images.length}/10 selected · Minimum 5
                </span>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-600 transition-all duration-300"
                  style={{ width: `${images.length * 10}%` }}
                />
              </div>

              <input
                id="property-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={images.length >= 10 || loading}
                onChange={handleImageChange}
                className="hidden"
              />

              <label
                htmlFor="property-images"
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-300 bg-white px-4 py-8 text-center transition ${
                  images.length >= 10 || loading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:border-green-600 hover:bg-green-50"
                }`}
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <UploadCloud size={28} />
                </div>

                <span className="font-bold text-gray-900">
                  {images.length >= 10
                    ? "Image limit reached"
                    : "Choose property images"}
                </span>

                <span className="mt-1 text-sm text-gray-500">
                  Select multiple images from your device
                </span>

                <span className="mt-3 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white">
                  Browse images
                </span>
              </label>

              {/* IMAGE PREVIEWS */}
              {imagePreviews.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-800">
                      Selected photographs
                    </h4>

                    <span className="text-xs text-gray-500">
                      Remove a mistaken image and choose another
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={`${preview.name}-${index}`}
                        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                      >
                        <img
                          src={preview.url}
                          alt={`Property photograph ${index + 1}`}
                          className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        <div className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 text-xs font-semibold text-white">
                          Image {index + 1}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={loading}
                          aria-label={`Remove image ${index + 1}`}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50"
                        >
                          <X size={16} />
                        </button>

                        <div className="truncate px-2 py-2 text-xs text-gray-600">
                          {preview.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* VIDEO UPLOAD */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-gray-900">
                    <Video size={20} className="text-blue-700" />
                    Property videos
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    MP4, WebM, MOV, M4V or AVI · Maximum 100 MB per video
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    videos.length >= 2
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {videos.length}/3 selected · Minimum 2
                </span>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(videos.length / 3) * 100}%` }}
                />
              </div>

              <input
                id="property-videos"
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/avi"
                multiple
                disabled={videos.length >= 3 || loading}
                onChange={handleVideoChange}
                className="hidden"
              />

              <label
                htmlFor="property-videos"
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-white px-4 py-8 text-center transition ${
                  videos.length >= 3 || loading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:border-blue-600 hover:bg-blue-50"
                }`}
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Video size={28} />
                </div>

                <span className="font-bold text-gray-900">
                  {videos.length >= 3
                    ? "Video limit reached"
                    : "Choose property videos"}
                </span>

                <span className="mt-1 text-sm text-gray-500">
                  Select videos showing the property
                </span>

                <span className="mt-3 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white">
                  Browse videos
                </span>
              </label>

              {/* SELECTED VIDEO FILES */}
              {videos.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h4 className="mb-3 text-sm font-bold text-gray-800">
                    Selected videos
                  </h4>

                  {videos.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <Video size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {file.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        disabled={loading}
                        aria-label={`Remove video ${index + 1}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MEDIA REQUIREMENTS */}
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <CheckCircle2
                className="mt-0.5 shrink-0 text-amber-700"
                size={19}
              />

              <p className="text-sm leading-6 text-amber-900">
                Submission requires <strong>5–10 images</strong> and
                <strong> 2–3 videos</strong>. You can remove mistakenly selected
                files before submitting your property.
              </p>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="border-t border-gray-200 pt-7">
            <button
              type="submit"
              disabled={loading || !user?.isEmailVerified}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-700 px-6 py-4 font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting property...
                </>
              ) : (
                <>
                  Submit property for review
                  <Send size={18} />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              Your property will be reviewed before publication.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}


export function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to Amanah AI. I can help explain property terms and guide you through the marketplace. Live property search will be connected in a later phase.",
    },
  ]);
  function send(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: prompt.trim() },
      {
        role: "assistant",
        text: "Thanks. The AI service is not connected yet, so I cannot verify live listings or provide a property-specific answer. That integration is part of the AI phase.",
      },
    ]);
    setPrompt("");
  }
  return (
    <section className="page-section shell narrow-page">
      <span className="eyebrow dark">
        <Sparkles size={14} /> AMANAH AI
      </span>
      <h1>
        A clearer way to
        <br />
        <em>explore property.</em>
      </h1>
      <p>
        Ask general questions about buying, leasing, renting or selling. The
        production assistant will be grounded in verified platform data.
      </p>
      <div className="chat-panel">
        {messages.map((m, i) => (
          <div className={`chat-message ${m.role}`} key={i}>
            {m.text}
          </div>
        ))}
        <form className="chat-input" onSubmit={send}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a property question…"
          />
          <button aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      </div>
      <p className="small-note">
        This preview is not legal, financial or valuation advice. It does not
        approve properties, documents or transactions.
      </p>
    </section>
  );
}

export function AboutPage() {
  return (
    <section className="page-section shell narrow-page">
      <span className="eyebrow dark">ABOUT AMANAH</span>
      <h1>
        Property service built
        <br />
        <em>around trust.</em>
      </h1>
      <p>
        AMANAH ESTATES is being developed as a property marketplace and
        managed-service platform for land, homes, leasing, rentals and resale
        support.
      </p>
    </section>
  );
}

export function NotFoundPage() {
  return (
    <section className="page-section shell narrow-page">
      <h1>Page not found</h1>
      <Link to="/">Return home</Link>
    </section>
  );
}
