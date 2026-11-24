import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Archive,
  RotateCcw,
  Globe,
  Eye,
  AlertCircle,
  Plus,
  ImagePlus,
  Upload,
  X,
  MapPin,
  Pencil,
  Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { TableSkeleton } from "../../components/ui/LoadingState.jsx";

const initialFilters = {
  search: "",
  estateType: "",
  developmentStatus: "",
  publicationStatus: "",
  sort: "newest",
};

const emptyPagination = {
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const emptyEstateForm = {
  name: "",
  description: "",
  estateType: "residential",
  developmentStatus: "under_construction",
  area: "",
  address: "",
  progressPercentage: "0",
  city: "",
  state: "",
  country: "Nigeria",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1769AA] focus:ring-4 focus:ring-blue-100";
const labelClass = "mb-2 block text-sm font-semibold text-slate-700";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769AA] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12558B] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function StatusBadge({ value }) {
  const styles = {
    published: "bg-green-100 text-green-700",
    draft: "bg-slate-100 text-slate-700",
    archived: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    under_construction: "bg-amber-100 text-amber-800",
    paused: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        styles[value] || "bg-slate-100 text-slate-600"
      }`}
    >
      {(value || "unknown").replaceAll("_", " ")}
    </span>
  );
}

function getEstateLocation(estate) {
  const location = estate.location || {};
  return (
    [location.area, location.city, location.state, location.country]
      .filter(Boolean)
      .join(", ") || "Location not specified"
  );
}

function getEstateCover(estate) {
  return typeof estate.coverImage === "string"
    ? estate.coverImage
    : estate.coverImage?.url || "";
}

function getProgress(estate) {
  const value = Number(estate.construction?.progressPercentage);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

function validateImage(file, notifyError) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    notifyError("Please select a JPG, PNG, or WebP image.");
    return false;
  }

  if (file.size > 10 * 1024 * 1024) {
    notifyError("Cover image must not exceed 10 MB.");
    return false;
  }

  return true;
}

export default function AdminEstates() {
  const { token } = useAuth();
  const { success, error, info } = useToast();

  const [estates, setEstates] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState(emptyPagination);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [processing, setProcessing] = useState({});
  const [progressDrafts, setProgressDrafts] = useState({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [estateForm, setEstateForm] = useState(emptyEstateForm);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [createdEstateId, setCreatedEstateId] = useState("");
  const [coverTargetEstate, setCoverTargetEstate] = useState(null);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const fetchEstates = useCallback(
    async (page = 1) => {
      if (!token) {
        setLoading(false);
        setLoadError(
          "Your admin session is unavailable. Please sign in again.",
        );
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response = await api.getAllAdminEstates(
          { ...appliedFilters, page, limit: 12 },
          token,
        );

        setEstates(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || emptyPagination);
      } catch (err) {
        setLoadError(err.message || "Unable to load estates.");
      } finally {
        setLoading(false);
      }
    },
    [token, appliedFilters],
  );

  useEffect(() => {
    fetchEstates(1);
  }, [fetchEstates]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleSearch(event) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  function updateEstateField(event) {
    const { name, value } = event.target;
    setEstateForm((current) => ({ ...current, [name]: value }));
  }

  function clearCoverSelection() {
    setCoverFile(null);
    setCoverPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return "";
    });
  }

  function handleCoverSelection(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImage(file, error)) {
      event.target.value = "";
      return;
    }

    clearCoverSelection();
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function resetCreateForm() {
    if (createdEstateId) {
      info(
        "This estate has already been created. Complete its cover upload before closing the form.",
      );
      return;
    }

    setEstateForm(emptyEstateForm);
    clearCoverSelection();
    setShowCreateForm(false);
  }

  async function handleCreateEstate(event) {
    event.preventDefault();

    if (!coverFile) {
      error("Please select an estate cover image.");
      return;
    }

    if (
      !createdEstateId &&
      (!estateForm.name.trim() ||
        !estateForm.description.trim() ||
        !estateForm.city.trim() ||
        !estateForm.state.trim() ||
        !estateForm.country.trim())
    ) {
      error("Please complete all required estate information.");
      return;
    }

    const progress = Number(estateForm.progressPercentage);
    if (
      !createdEstateId &&
      (!Number.isFinite(progress) || progress < 0 || progress > 100)
    ) {
      error("Development progress must be between 0 and 100.");
      return;
    }

    try {
      setCreateLoading(true);
      let estateId = createdEstateId;

      // Reuse the estate ID if its previous cover upload failed.
      if (!estateId) {
        const response = await api.createAdminEstate(
          {
            name: estateForm.name.trim(),
            description: estateForm.description.trim(),
            estateType: estateForm.estateType,
            developmentStatus: estateForm.developmentStatus,
            construction: { progressPercentage: progress },
            location: {
              area: estateForm.area.trim(),
              address: estateForm.address.trim(),
              city: estateForm.city.trim(),
              state: estateForm.state.trim(),
              country: estateForm.country.trim(),
            },
          },
          token,
        );

        estateId = response.data?._id;
        if (!estateId) {
          throw new Error("Estate was created, but its ID was not returned.");
        }

        setCreatedEstateId(estateId);
      }

      setCoverLoading(true);
      await api.uploadAdminEstateCover(estateId, coverFile, token);

      success(
        "Estate created successfully with its cover image. It is saved as a draft.",
      );
      setEstateForm(emptyEstateForm);
      clearCoverSelection();
      setCreatedEstateId("");
      setShowCreateForm(false);
      await fetchEstates(1);
    } catch (err) {
      error(
        err.message || "Unable to create the estate or upload its cover image.",
      );
    } finally {
      setCreateLoading(false);
      setCoverLoading(false);
    }
  }

  function openExistingCoverUpload(estate) {
    clearCoverSelection();
    setCoverTargetEstate(estate);
  }

  function closeExistingCoverUpload() {
    if (coverLoading) return;
    setCoverTargetEstate(null);
    clearCoverSelection();
  }

  async function handleExistingCoverUpload(event) {
    event.preventDefault();

    if (!coverTargetEstate || !coverFile) {
      error("Please select a cover image.");
      return;
    }

    try {
      setCoverLoading(true);
      await api.uploadAdminEstateCover(coverTargetEstate._id, coverFile, token);
      success(`Cover image updated for ${coverTargetEstate.name}.`);
      setCoverTargetEstate(null);
      clearCoverSelection();
      await fetchEstates(pagination.page || 1);
    } catch (err) {
      error(err.message || "Unable to upload the estate cover image.");
    } finally {
      setCoverLoading(false);
    }
  }

  async function handleEstateAction(estate, action) {
    const estateName = estate.name || "this estate";

    if (action === "publish" && !getEstateCover(estate)) {
      error("Upload a cover image before publishing this estate.");
      return;
    }

    const messages = {
      publish: `Publish "${estateName}"? It will become publicly visible.`,
      archive: `Archive "${estateName}"?`,
      restore: `Restore "${estateName}" to Draft?`,
    };

    if (!window.confirm(messages[action])) return;

    try {
      setProcessing((current) => ({ ...current, [estate._id]: true }));

      if (action === "publish") {
        await api.publishAdminEstate(estate._id, token);
        success("Estate published successfully.");
      } else if (action === "archive") {
        await api.archiveAdminEstate(estate._id, token);
        success("Estate archived successfully.");
      } else if (action === "restore") {
        await api.restoreAdminEstate(estate._id, token);
        success("Estate restored to Draft.");
      }

      await fetchEstates(pagination.page || 1);
    } catch (err) {
      error(err.message || "Unable to update this estate.");
    } finally {
      setProcessing((current) => ({ ...current, [estate._id]: false }));
    }
  }

  async function handleSaveProgress(estate) {
    if (estate.publicationStatus === "archived") {
      error("Restore this estate before editing its development progress.");
      return;
    }

    const rawValue = progressDrafts[estate._id] ?? String(getProgress(estate));
    if (rawValue === "") {
      error("Enter a development progress percentage.");
      return;
    }

    const progressPercentage = Number(rawValue);
    if (
      !Number.isFinite(progressPercentage) ||
      progressPercentage < 0 ||
      progressPercentage > 100
    ) {
      error("Development progress must be between 0 and 100.");
      return;
    }

    try {
      setProcessing((current) => ({ ...current, [estate._id]: true }));

      await api.updateAdminEstate(
        estate._id,
        { construction: { progressPercentage } },
        token,
      );

      success("Development progress updated successfully.");
      setProgressDrafts((current) => {
        const next = { ...current };
        delete next[estate._id];
        return next;
      });
      await fetchEstates(pagination.page || 1);
    } catch (err) {
      error(err.message || "Unable to update development progress.");
    } finally {
      setProcessing((current) => ({ ...current, [estate._id]: false }));
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#1769AA]">
            Property Management
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Estate Showcase
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage estate developments, publication status, cover images, and
            construction progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            disabled={Boolean(createdEstateId) || createLoading}
            className={primaryButton}
          >
            <Plus size={16} />
            {showCreateForm ? "Close Form" : "Create Estate"}
          </button>
          <button
            type="button"
            onClick={() => fetchEstates(pagination.page || 1)}
            disabled={loading}
            className={secondaryButton}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {showCreateForm && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769AA]">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Create New Estate
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Newly created estates remain drafts until published.
              </p>
            </div>
          </div>

          {createdEstateId && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              The estate already exists. Retry its cover upload without creating
              another estate.
            </div>
          )}

          <form onSubmit={handleCreateEstate} className="space-y-6">
            <fieldset
              disabled={Boolean(createdEstateId) || createLoading}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Estate name *</label>
                  <input
                    required
                    name="name"
                    value={estateForm.name}
                    onChange={updateEstateField}
                    placeholder="e.g. Amanah Gardens"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Estate type *</label>
                  <select
                    name="estateType"
                    value={estateForm.estateType}
                    onChange={updateEstateField}
                    className={inputClass}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed_use">Mixed use</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Development status *</label>
                  <select
                    name="developmentStatus"
                    value={estateForm.developmentStatus}
                    onChange={updateEstateField}
                    className={inputClass}
                  >
                    <option value="under_construction">
                      Under construction
                    </option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Development progress (%)</label>
                  <input
                    type="number"
                    name="progressPercentage"
                    min="0"
                    max="100"
                    step="1"
                    value={estateForm.progressPercentage}
                    onChange={updateEstateField}
                    placeholder="e.g. 35"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Enter the actual construction completion percentage, from 0
                    to 100.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Area / neighbourhood</label>
                  <input
                    name="area"
                    value={estateForm.area}
                    onChange={updateEstateField}
                    placeholder="e.g. Lekki Phase 1"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>City *</label>
                  <input
                    required
                    name="city"
                    value={estateForm.city}
                    onChange={updateEstateField}
                    placeholder="City"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>State *</label>
                  <input
                    required
                    name="state"
                    value={estateForm.state}
                    onChange={updateEstateField}
                    placeholder="State"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Country *</label>
                  <input
                    required
                    name="country"
                    value={estateForm.country}
                    onChange={updateEstateField}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Street address</label>
                  <input
                    name="address"
                    value={estateForm.address}
                    onChange={updateEstateField}
                    placeholder="Full estate address"
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
                  value={estateForm.description}
                  onChange={updateEstateField}
                  placeholder="Describe the estate, location, facilities and development..."
                  className={inputClass}
                />
              </div>
            </fieldset>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <ImagePlus size={21} className="text-[#1769AA]" />
                <h3 className="font-semibold text-slate-800">
                  Estate cover image *
                </h3>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                JPG, PNG or WebP. Maximum file size: 10 MB.
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={!createdEstateId}
                onChange={handleCoverSelection}
                disabled={createLoading || coverLoading}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#1769AA] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#12558B]"
              />
              {coverPreview && (
                <div className="relative mt-5 max-w-xl">
                  <img
                    src={coverPreview}
                    alt="Estate cover preview"
                    className="h-60 w-full rounded-xl object-cover"
                  />
                  {!createdEstateId && (
                    <button
                      type="button"
                      onClick={clearCoverSelection}
                      disabled={createLoading || coverLoading}
                      title="Remove selected image"
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={17} />
                    </button>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {coverFile?.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={createLoading || coverLoading}
                className={primaryButton}
              >
                <Upload size={16} />
                {coverLoading
                  ? "Uploading cover..."
                  : createLoading
                    ? "Creating estate..."
                    : createdEstateId
                      ? "Retry cover upload"
                      : "Create Estate"}
              </button>
              {!createdEstateId && (
                <button
                  type="button"
                  onClick={resetCreateForm}
                  disabled={createLoading || coverLoading}
                  className={secondaryButton}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {coverTargetEstate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Update Cover Image
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {coverTargetEstate.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeExistingCoverUpload}
                disabled={coverLoading}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleExistingCoverUpload} className="space-y-5">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={handleCoverSelection}
                disabled={coverLoading}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1769AA] file:px-4 file:py-2 file:font-semibold file:text-white"
              />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="New estate cover preview"
                  className="h-56 w-full rounded-xl object-cover"
                />
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeExistingCoverUpload}
                  disabled={coverLoading}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!coverFile || coverLoading}
                  className={primaryButton}
                >
                  <Upload size={16} />
                  {coverLoading ? "Uploading..." : "Upload Cover"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch}>
          <div className="mb-4 flex items-center gap-2">
            <Search size={18} className="text-[#1769AA]" />
            <h2 className="font-semibold text-slate-900">Search and filter</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label htmlFor="estate-search" className={labelClass}>
                Search estates
              </label>
              <input
                id="estate-search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Estate name or location"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="estate-type" className={labelClass}>
                Estate type
              </label>
              <select
                id="estate-type"
                name="estateType"
                value={filters.estateType}
                onChange={handleFilterChange}
                className={inputClass}
              >
                <option value="">All types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed_use">Mixed use</option>
              </select>
            </div>
            <div>
              <label htmlFor="estate-development-status" className={labelClass}>
                Development
              </label>
              <select
                id="estate-development-status"
                name="developmentStatus"
                value={filters.developmentStatus}
                onChange={handleFilterChange}
                className={inputClass}
              >
                <option value="">All development</option>
                <option value="under_construction">Under construction</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label htmlFor="estate-publication-status" className={labelClass}>
                Publication
              </label>
              <select
                id="estate-publication-status"
                name="publicationStatus"
                value={filters.publicationStatus}
                onChange={handleFilterChange}
                className={inputClass}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className={primaryButton}>
              <Search size={16} />
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className={secondaryButton}
            >
              Clear filters
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">Estate records</h2>
            <p className="mt-1 text-sm text-slate-500">
              {pagination.total || 0} estate
              {(pagination.total || 0) === 1 ? "" : "s"} found
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <Building2 size={15} />
            Admin estate directory
          </div>
        </div>

        {loadError && (
          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">{loadError}</div>
            <button
              type="button"
              onClick={() => fetchEstates(pagination.page || 1)}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : estates.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1769AA]">
              <Building2 size={26} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No estates found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              No estates match these filters. Clear your filters or create an
              estate to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Estate</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 font-semibold">Development</th>
                    <th className="px-5 py-4 font-semibold">Publication</th>
                    <th className="px-5 py-4 font-semibold">Progress</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estates.map((estate) => {
                    const isProcessing = Boolean(processing[estate._id]);
                    const coverImage = getEstateCover(estate);
                    const savedProgress = getProgress(estate);
                    const draftValue =
                      progressDrafts[estate._id] ?? String(savedProgress);
                    const hasProgressChanged =
                      draftValue !== "" && Number(draftValue) !== savedProgress;
                    const isArchived = estate.publicationStatus === "archived";

                    return (
                      <tr
                        key={estate._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={estate.name || "Estate cover"}
                                className="h-14 w-16 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                <ImagePlus size={21} />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">
                                {estate.name || "Unnamed estate"}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={12} />
                                {getEstateLocation(estate)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm capitalize text-slate-600">
                          {(estate.estateType || "unknown").replaceAll(
                            "_",
                            " ",
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={estate.developmentStatus} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={estate.publicationStatus} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="w-44">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                              <span>{savedProgress}% complete</span>
                            </div>
                            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#1769AA] transition-all duration-300"
                                style={{ width: `${savedProgress}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                aria-label={`Development progress for ${estate.name}`}
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={draftValue}
                                onChange={(event) =>
                                  setProgressDrafts((current) => ({
                                    ...current,
                                    [estate._id]: event.target.value,
                                  }))
                                }
                                disabled={isProcessing || isArchived}
                                className="w-20 rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#1769AA] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveProgress(estate)}
                                disabled={
                                  isProcessing ||
                                  isArchived ||
                                  !hasProgressChanged
                                }
                                title="Save development progress"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#1769AA] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Save size={14} />
                                Save
                              </button>
                            </div>
                            {isArchived && (
                              <p className="mt-2 text-xs text-amber-700">
                                Restore estate to edit progress.
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/admin/estates/${estate._id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#1769AA] transition hover:bg-blue-100"
                            >
                              <Pencil size={14} />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => openExistingCoverUpload(estate)}
                              disabled={isProcessing || coverLoading}
                              title="Upload or replace cover image"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#1769AA] transition hover:bg-blue-100 disabled:opacity-50"
                            >
                              <Pencil size={14} />
                              Cover
                            </button>
                            {estate.publicationStatus === "draft" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEstateAction(estate, "publish")
                                }
                                disabled={isProcessing || !coverImage}
                                title={
                                  coverImage
                                    ? "Publish estate"
                                    : "Upload a cover image before publishing"
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Globe size={14} />
                                Publish
                              </button>
                            )}
                            {estate.publicationStatus !== "archived" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEstateAction(estate, "archive")
                                }
                                disabled={isProcessing}
                                title="Archive estate"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                <Archive size={14} />
                                Archive
                              </button>
                            )}
                            {estate.publicationStatus === "archived" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEstateAction(estate, "restore")
                                }
                                disabled={isProcessing}
                                title="Restore estate"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                              >
                                <RotateCcw size={14} />
                                Restore
                              </button>
                            )}
                            {estate.publicationStatus === "published" && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                                <Eye size={14} />
                                Live
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-500">
                Page {pagination.page || 1} of {pagination.totalPages || 1}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchEstates((pagination.page || 1) - 1)}
                  disabled={
                    loading ||
                    !(pagination.hasPreviousPage || (pagination.page || 1) > 1)
                  }
                  className={secondaryButton}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchEstates((pagination.page || 1) + 1)}
                  disabled={
                    loading ||
                    !(
                      pagination.hasNextPage ||
                      (pagination.page || 1) < (pagination.totalPages || 0)
                    )
                  }
                  className={secondaryButton}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
