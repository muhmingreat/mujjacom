import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Upload,
  ImagePlus,
  Video,
  Trash2,
  MapPin,
  Building2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { PageSkeleton } from "../../components/ui/LoadingState.jsx";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1769AA] focus:ring-4 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12558B] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const emptyForm = {
  name: "",
  description: "",
  estateType: "residential",
  developmentStatus: "under_construction",
  area: "",
  address: "",
  city: "",
  state: "",
  country: "Nigeria",
  progressPercentage: "0",
  startDate: "",
  estimatedCompletionDate: "",
  actualCompletionDate: "",
  amenities: "",
  highlights: "",
};

function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function toDateValue(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function splitLines(value) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getGallery(estate) {
  return Array.isArray(estate?.gallery) ? estate.gallery : [];
}

function validateFiles(files, type, notifyError) {
  const imageTypes = ["image/jpeg", "image/png", "image/webp"];
  const videoTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
    "video/x-msvideo",
    "video/avi",
  ];

  const allowedTypes = type === "image" ? imageTypes : videoTypes;
  const maxSize = type === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      notifyError(`Unsupported ${type} format: ${file.name}`);
      return false;
    }

    if (file.size > maxSize) {
      notifyError(
        `${file.name} exceeds the ${type === "image" ? "10 MB" : "100 MB"} limit.`
      );
      return false;
    }
  }

  return true;
}

export default function AdminEditEstate() {
  const { estateId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { success, error, info } = useToast();

  const [estate, setEstate] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [videosUploading, setVideosUploading] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState({});

  const [coverFile, setCoverFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);

  const fetchEstate = useCallback(async () => {
    if (!token) {
      setLoading(false);
      error("Your admin session is unavailable. Please sign in again.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.getAdminEstate(estateId, token);
      const data = response.data;

      if (!data) {
        throw new Error("Estate details were not returned.");
      }

      setEstate(data);

      setForm({
        name: data.name || "",
        description: data.description || "",
        estateType: data.estateType || "residential",
        developmentStatus:
          data.developmentStatus || "under_construction",

        area: data.location?.area || "",
        address: data.location?.address || "",
        city: data.location?.city || "",
        state: data.location?.state || "",
        country: data.location?.country || "Nigeria",

        progressPercentage: String(
          data.construction?.progressPercentage ?? 0
        ),

        startDate: toDateInput(data.construction?.startDate),
        estimatedCompletionDate: toDateInput(
          data.construction?.estimatedCompletionDate
        ),
        actualCompletionDate: toDateInput(
          data.construction?.actualCompletionDate
        ),

        amenities: Array.isArray(data.amenities)
          ? data.amenities.join("\n")
          : "",

        highlights: Array.isArray(data.highlights)
          ? data.highlights.join("\n")
          : "",
      });
    } catch (err) {
      error(err.message || "Unable to load estate details.");
    } finally {
      setLoading(false);
    }
  }, [estateId, token, error]);

  useEffect(() => {
    fetchEstate();
  }, [fetchEstate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!estate) return;

    if (estate.publicationStatus === "archived") {
      error("Restore this estate before editing it.");
      return;
    }

    const progress = Number(form.progressPercentage);

    if (
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      error("Development progress must be between 0 and 100.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.country.trim()
    ) {
      error("Complete all required estate information.");
      return;
    }

    try {
      setSaving(true);

      await api.updateAdminEstate(
        estateId,
        {
          name: form.name.trim(),
          description: form.description.trim(),
          estateType: form.estateType,
          developmentStatus: form.developmentStatus,

          location: {
            area: form.area.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            country: form.country.trim(),
          },

          construction: {
            progressPercentage: progress,
            startDate: toDateValue(form.startDate),
            estimatedCompletionDate: toDateValue(
              form.estimatedCompletionDate
            ),
            actualCompletionDate: toDateValue(
              form.actualCompletionDate
            ),
          },

          amenities: splitLines(form.amenities),
          highlights: splitLines(form.highlights),
        },
        token
      );

      success("Estate details updated successfully.");
      await fetchEstate();
    } catch (err) {
      error(err.message || "Unable to update estate details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(event) {
    event.preventDefault();

    if (!coverFile) {
      error("Select a cover image first.");
      return;
    }

    if (!validateFiles([coverFile], "image", error)) return;

    try {
      setCoverUploading(true);

      await api.uploadAdminEstateCover(estateId, coverFile, token);

      setCoverFile(null);
      success("Estate cover image updated successfully.");
      await fetchEstate();
    } catch (err) {
      error(err.message || "Unable to upload cover image.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleGalleryUpload(type) {
    const isImage = type === "image";
    const files = isImage ? imageFiles : videoFiles;

    if (!files.length) {
      error(`Select at least one gallery ${type} first.`);
      return;
    }

    if (!validateFiles(files, type, error)) return;

    const gallery = getGallery(estate);
    const existingCount = gallery.filter(
      (item) => item.type === type
    ).length;

    const maximum = isImage ? 10 : 3;

    if (existingCount + files.length > maximum) {
      error(
        `You can have a maximum of ${maximum} gallery ${type}${maximum === 1 ? "" : "s"}.`
      );
      return;
    }

    try {
      if (isImage) {
        setImagesUploading(true);

        await api.uploadAdminEstateGalleryImages(
          estateId,
          files,
          token
        );
      } else {
        setVideosUploading(true);

        await api.uploadAdminEstateGalleryVideos(
          estateId,
          files,
          token
        );
      }

      if (isImage) {
        setImageFiles([]);
        const input = document.getElementById("estate-gallery-images");
        if (input) input.value = "";
      } else {
        setVideoFiles([]);
        const input = document.getElementById("estate-gallery-videos");
        if (input) input.value = "";
      }

      success(`Gallery ${type}s uploaded successfully.`);
      await fetchEstate();
    } catch (err) {
      error(err.message || `Unable to upload gallery ${type}s.`);
    } finally {
      setImagesUploading(false);
      setVideosUploading(false);
    }
  }

  async function handleDeleteMedia(media) {
    if (!media?._id) {
      error("This gallery item has no valid media ID.");
      return;
    }

    if (!window.confirm("Remove this item from the estate gallery?")) {
      return;
    }

    try {
      setDeletingMedia((current) => ({
        ...current,
        [media._id]: true,
      }));

      await api.deleteAdminEstateGalleryMedia(
        estateId,
        media._id,
        token
      );

      success("Gallery item removed successfully.");
      await fetchEstate();
    } catch (err) {
      error(err.message || "Unable to remove this gallery item.");
    } finally {
      setDeletingMedia((current) => ({
        ...current,
        [media._id]: false,
      }));
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (!estate) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <p className="font-semibold">Unable to load this estate.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={fetchEstate} className={primaryButton}>
              <RefreshCw size={16} />
              Retry
            </button>
            <Link to="/admin/estates" className={secondaryButton}>
              Back to estates
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const gallery = getGallery(estate);
  const imageCount = gallery.filter((item) => item.type === "image").length;
  const videoCount = gallery.filter((item) => item.type === "video").length;
  const isArchived = estate.publicationStatus === "archived";

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            to="/admin/estates"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1769AA] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to estates
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#1769AA]">
            Estate Management
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Edit Estate
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update estate information, construction details, cover image, and gallery.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchEstate}
            disabled={loading || saving}
            className={secondaryButton}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <Link to="/admin/estates" className={secondaryButton}>
            Estate directory
          </Link>
        </div>
      </div>

      {isArchived && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This estate is archived. Restore it from the estate directory before making changes.
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="mb-8 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769AA]">
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Estate information
            </h2>
            <p className="text-sm text-slate-500">
              Update the main details displayed to prospective buyers.
            </p>
          </div>
        </div>

        <fieldset disabled={saving || isArchived} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Estate name *</label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Estate type</label>
              <select
                name="estateType"
                value={form.estateType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed_use">Mixed use</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Development status</label>
              <select
                name="developmentStatus"
                value={form.developmentStatus}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="under_construction">Under construction</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Development progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                name="progressPercentage"
                value={form.progressPercentage}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Estate description *</label>
            <textarea
              required
              rows={5}
              name="description"
              value={form.description}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <MapPin size={18} className="text-[#1769AA]" />
              Estate location
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Area / neighbourhood</label>
                <input
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Street address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>City *</label>
                <input
                  required
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>State *</label>
                <input
                  required
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Country *</label>
                <input
                  required
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 font-bold text-slate-900">
              Construction timeline
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className={labelClass}>Start date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Estimated completion</label>
                <input
                  type="date"
                  name="estimatedCompletionDate"
                  value={form.estimatedCompletionDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Actual completion</label>
                <input
                  type="date"
                  name="actualCompletionDate"
                  value={form.actualCompletionDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>Amenities</label>
              <textarea
                rows={5}
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder={"Swimming pool\n24-hour security\nRecreation centre"}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter one amenity per line.
              </p>
            </div>

            <div>
              <label className={labelClass}>Highlights</label>
              <textarea
                rows={5}
                name="highlights"
                value={form.highlights}
                onChange={handleChange}
                placeholder={"Strategic location\nModern infrastructure\nFlexible payment options"}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter one highlight per line.
              </p>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Link to="/admin/estates" className={secondaryButton}>
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || isArchived}
            className={primaryButton}
          >
            <Save size={16} />
            {saving ? "Saving changes..." : "Save estate changes"}
          </button>
        </div>
      </form>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Estate cover image
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Replace the main image used on the estate showcase.
          </p>
        </div>

        {estate.coverImage && (
          <img
            src={typeof estate.coverImage === "string" ? estate.coverImage : estate.coverImage.url}
            alt={`${estate.name} cover`}
            className="mb-5 h-64 w-full rounded-xl object-cover"
          />
        )}

        <form
          onSubmit={handleCoverUpload}
          className="flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={coverUploading || isArchived}
            onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1769AA] file:px-4 file:py-2 file:font-semibold file:text-white"
          />

          <button
            type="submit"
            disabled={!coverFile || coverUploading || isArchived}
            className={primaryButton}
          >
            <Upload size={16} />
            {coverUploading ? "Uploading..." : "Replace cover"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Estate gallery
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload and manage the images and videos shown on the public estate page.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-blue-50 px-3 py-2 text-[#1769AA]">
              {imageCount}/10 images
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">
              {videoCount}/3 videos
            </span>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-300 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
              <ImagePlus size={18} className="text-[#1769AA]" />
              Upload gallery images
            </h3>
            <p className="mb-3 text-xs leading-5 text-slate-500">
              JPG, PNG or WebP. Maximum 10 images total, 10 MB per image.
            </p>
            <input
              id="estate-gallery-images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={imagesUploading || isArchived || imageCount >= 10}
              onChange={(event) =>
                setImageFiles(Array.from(event.target.files || []))
              }
              className="block w-full text-sm text-slate-600"
            />
            {imageFiles.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {imageFiles.length} image(s) selected
              </p>
            )}
            <button
              type="button"
              onClick={() => handleGalleryUpload("image")}
              disabled={
                !imageFiles.length ||
                imagesUploading ||
                isArchived ||
                imageCount >= 10
              }
              className={`${primaryButton} mt-4`}
            >
              <Upload size={15} />
              {imagesUploading ? "Uploading..." : "Upload images"}
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
              <Video size={18} className="text-[#1769AA]" />
              Upload gallery videos
            </h3>
            <p className="mb-3 text-xs leading-5 text-slate-500">
              MP4, WebM, MOV, M4V or AVI. Maximum 3 videos total, 100 MB per video.
            </p>
            <input
              id="estate-gallery-videos"
              type="file"
              multiple
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/avi"
              disabled={videosUploading || isArchived || videoCount >= 3}
              onChange={(event) =>
                setVideoFiles(Array.from(event.target.files || []))
              }
              className="block w-full text-sm text-slate-600"
            />
            {videoFiles.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {videoFiles.length} video(s) selected
              </p>
            )}
            <button
              type="button"
              onClick={() => handleGalleryUpload("video")}
              disabled={
                !videoFiles.length ||
                videosUploading ||
                isArchived ||
                videoCount >= 3
              }
              className={`${primaryButton} mt-4`}
            >
              <Upload size={15} />
              {videosUploading ? "Uploading..." : "Upload videos"}
            </button>
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-5 py-12 text-center">
            <ImagePlus size={30} className="mx-auto mb-3 text-slate-400" />
            <p className="font-semibold text-slate-700">
              No gallery media yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Upload images or videos to build this estate's gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((media) => (
              <article
                key={media._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                {media.type === "video" ? (
                  <video
                    src={media.url}
                    controls
                    preload="metadata"
                    className="h-52 w-full bg-slate-950 object-contain"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={media.caption || estate.name}
                    loading="lazy"
                    className="h-52 w-full object-cover"
                  />
                )}

                <div className="flex items-center justify-between gap-3 p-3">
                  <span className="text-xs font-semibold capitalize text-slate-600">
                    {media.type || "Media"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(media)}
                    disabled={
                      isArchived || Boolean(deletingMedia[media._id])
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {deletingMedia[media._id] ? "Removing..." : "Remove"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}