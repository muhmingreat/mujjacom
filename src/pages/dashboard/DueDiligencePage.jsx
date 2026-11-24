
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  Upload,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck2,
  Building2,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../services/api.js";

const CASE_LABELS = {
  documents_requested: "Documents requested",
  submitted: "Submitted",
  under_review: "Under review",
  needs_correction: "Correction required",
  verified: "Documents verified",
  rejected: "Case rejected",
};

const DOC_LABELS = {
  submitted: "Submitted",
  approved: "Approved",
  needs_correction: "Correction required",
  rejected: "Rejected",
};

const statusClass = {
  documents_requested: "bg-amber-50 text-amber-800 ring-amber-200",
  submitted: "bg-blue-50 text-blue-800 ring-blue-200",
  under_review: "bg-blue-50 text-blue-800 ring-blue-200",
  needs_correction: "bg-orange-50 text-orange-800 ring-orange-200",
  verified: "bg-green-50 text-green-800 ring-green-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
  approved: "bg-green-50 text-green-800 ring-green-200",
};

function Badge({ status, label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusClass[status] ||
        "bg-gray-50 text-gray-700 ring-gray-200"
      }`}
    >
      {label || CASE_LABELS[status] || DOC_LABELS[status] || status || "Unknown"}
    </span>
  );
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function formatPropertyType(value) {
  if (!value) return "Property";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRequirementState(requirement, documents) {
  const matching = documents.filter(
    (document) => document.documentType === requirement.documentType
  );

  if (matching.some((document) => document.status === "approved")) {
    return {
      status: "approved",
      label: "Approved",
      icon: CheckCircle2,
      color: "text-green-700",
    };
  }

  if (matching.some((document) => document.status === "rejected")) {
    return {
      status: "rejected",
      label: "Rejected",
      icon: XCircle,
      color: "text-red-700",
    };
  }

  if (matching.some((document) => document.status === "needs_correction")) {
    return {
      status: "needs_correction",
      label: "Correction required",
      icon: AlertCircle,
      color: "text-orange-700",
    };
  }

  if (matching.some((document) => document.status === "submitted")) {
    return {
      status: "submitted",
      label: "Under review",
      icon: Clock3,
      color: "text-blue-700",
    };
  }

  return {
    status: "missing",
    label: "Not submitted",
    icon: FileText,
    color: "text-gray-500",
  };
}

export default function DueDiligencePage() {
  const { token } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    searchParams.get("propertyId") || ""
  );
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [caseLoading, setCaseLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState("");
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [note, setNote] = useState("");

  const selectedProperty = useMemo(
    () =>
      properties.find(
        (property) => property._id === selectedPropertyId
      ),
    [properties, selectedPropertyId]
  );

  const documents = Array.isArray(activeCase?.documents)
    ? activeCase.documents
    : [];

  const requirements = Array.isArray(activeCase?.requiredDocuments)
    ? activeCase.requiredDocuments
    : [];

  const uploadOptions = useMemo(() => {
    return [
      ...requirements.map((item) => ({
        value: item.documentType,
        label: item.label,
        required: item.required,
      })),
      {
        value: "other",
        label: "Other supporting document",
        required: false,
      },
    ].filter(
      (item, index, array) =>
        array.findIndex((entry) => entry.value === item.value) === index
    );
  }, [requirements]);

  const checklistStats = useMemo(() => {
    const required = requirements.filter((item) => item.required);

    const approved = required.filter(
      (item) =>
        getRequirementState(item, documents).status === "approved"
    ).length;

    return {
      total: required.length,
      approved,
      outstanding: required.length - approved,
    };
  }, [requirements, documents]);

  const loadPage = useCallback(async () => {
    if (!token) {
      setLoading(false);
      toastError("Please sign in to access property due diligence.");
      return;
    }

    setLoading(true);

    try {
      const [propertyResponse, caseResponse] = await Promise.all([
        api.getMyProperties(token),
        api.getMyDueDiligenceCases(token),
      ]);

      const ownedProperties = Array.isArray(propertyResponse?.data)
        ? propertyResponse.data
        : [];

      const ownerCases = Array.isArray(caseResponse?.data)
        ? caseResponse.data
        : [];

      setProperties(ownedProperties);
      setCases(ownerCases);

      const requestedId = searchParams.get("propertyId");
      const currentId = selectedPropertyId || requestedId;

      const validId = ownedProperties.some(
        (item) => item._id === currentId
      );

      const nextId = validId
        ? currentId
        : ownedProperties[0]?._id || "";

      setSelectedPropertyId(nextId);

      if (nextId && nextId !== requestedId) {
        setSearchParams(
          { propertyId: nextId },
          { replace: true }
        );
      }
    } catch (err) {
      toastError(
        getErrorMessage(
          err,
          "Unable to load your due-diligence workspace."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [
    token,
    selectedPropertyId,
    searchParams,
    setSearchParams,
    toastError,
  ]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const loadCase = useCallback(
    async (propertyId) => {
      if (!propertyId || !token) {
        setActiveCase(null);
        return;
      }

      setCaseLoading(true);

      try {
        const response = await api.getMyDueDiligenceCase(
          propertyId,
          token
        );

        setActiveCase(response?.data || null);
      } catch (err) {
        setActiveCase(null);

        toastError(
          getErrorMessage(
            err,
            "Unable to load this property's due-diligence case."
          )
        );
      } finally {
        setCaseLoading(false);
      }
    },
    [token, toastError]
  );

  useEffect(() => {
    if (selectedPropertyId) {
      loadCase(selectedPropertyId);
    } else {
      setActiveCase(null);
    }
  }, [selectedPropertyId, loadCase]);

  useEffect(() => {
    if (uploadOptions.length === 0) {
      setDocumentType("");
      return;
    }

    if (
      !uploadOptions.some((item) => item.value === documentType)
    ) {
      setDocumentType(uploadOptions[0].value);
    }
  }, [uploadOptions, documentType]);

  function handlePropertyChange(value) {
    setSelectedPropertyId(value);

    if (value) {
      setSearchParams({ propertyId: value });
    } else {
      setSearchParams({});
    }

    setFile(null);
    setNote("");
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedPropertyId) {
      toastError("Select a property first.");
      return;
    }

    if (!file) {
      toastError("Choose a document to upload.");
      return;
    }

    if (
      !uploadOptions.some((item) => item.value === documentType)
    ) {
      toastError("Select a valid document type for this property.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toastError("Choose a PDF, JPG, PNG or WebP file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError("The file must be 10 MB or smaller.");
      return;
    }

    const formData = new FormData();

    formData.append("document", file);
    formData.append("documentType", documentType);
    formData.append("note", note.trim());

    setUploading(true);

    try {
      const response = await api.uploadMyDueDiligenceDocument(
        selectedPropertyId,
        formData,
        token
      );

      setActiveCase(response?.data || activeCase);
      setFile(null);
      setNote("");

      const input = document.getElementById(
        "due-diligence-file"
      );

      if (input) input.value = "";

      success("Document uploaded securely.");

      await loadCase(selectedPropertyId);

      const refreshed = await api.getMyDueDiligenceCases(token);

      setCases(
        Array.isArray(refreshed?.data)
          ? refreshed.data
          : []
      );
    } catch (err) {
      toastError(
        getErrorMessage(err, "Document upload failed.")
      );
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(documentId) {
    if (!activeCase?._id || !documentId) return;

    setOpeningDocumentId(documentId);

    try {
      const response = await api.getMyDueDiligenceDocumentAccess(
        activeCase._id,
        documentId,
        token
      );

      const data = response?.data || {};

      const url =
        data.url ||
        data.accessUrl ||
        data.accessURL ||
        data.downloadUrl;

      if (!url) {
        throw new Error(
          "The secure document link was not returned. Please try again."
        );
      }

      window.open(url, "_blank", "noopener,noreferrer");

      info("Secure document link generated. It expires shortly.");
    } catch (err) {
      toastError(
        getErrorMessage(err, "Unable to open this document.")
      );
    } finally {
      setOpeningDocumentId("");
    }
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#159447]">
            Property verification
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Due Diligence
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Submit supporting property documents for review.
            Requirements are determined by the property type and
            transaction type.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPage}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </header>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <p className="text-sm leading-6 text-blue-900">
            Due-diligence review on this platform is not a
            substitute for independent legal advice, land registry
            searches or professional title verification. Upload only
            documents you are authorized to share.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 text-gray-600">
          <RefreshCw size={20} className="animate-spin" />
          Loading your due-diligence workspace...
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <Building2 size={34} className="mx-auto text-gray-400" />

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            No owned properties found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Submit or add a property first. It will be available here
            once it appears in My Properties.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <label
              htmlFor="due-diligence-property"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Choose property
            </label>

            <select
              id="due-diligence-property"
              value={selectedPropertyId}
              onChange={(event) =>
                handlePropertyChange(event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#159447] focus:ring-2 focus:ring-green-100"
            >
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.title} —{" "}
                  {[property.location?.city, property.location?.state]
                    .filter(Boolean)
                    .join(", ")}
                </option>
              ))}
            </select>

            {selectedProperty && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Building2
                    size={19}
                    className="mt-0.5 text-[#1769AA]"
                  />

                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedProperty.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {[
                        selectedProperty.location?.area,
                        selectedProperty.location?.city,
                        selectedProperty.location?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Location not specified"}
                    </p>
                  </div>
                </div>

                {activeCase && <Badge status={activeCase.status} />}
              </div>
            )}
          </section>

          {caseLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-10 text-gray-600">
              <RefreshCw size={18} className="animate-spin" />
              Loading case...
            </div>
          ) : (
            <>
              {activeCase && (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#159447]">
                      <ShieldCheck size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-gray-900">
                        Case overview
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Track document submission and reviewer feedback.
                      </p>

                      <div className="mt-3">
                        <Badge status={activeCase.status} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Property type
                      </p>

                      <p className="mt-2 font-semibold text-gray-900">
                        {formatPropertyType(activeCase.propertyType)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Transaction type
                      </p>

                      <p className="mt-2 font-semibold capitalize text-gray-900">
                        {activeCase.transactionType || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {activeCase.adminNote && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                        Reviewer note
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                        {activeCase.adminNote}
                      </p>
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ClipboardList
                        size={21}
                        className="text-[#1769AA]"
                      />

                      <h2 className="text-lg font-bold text-gray-900">
                        Required document checklist
                      </h2>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      Each required document must be submitted and
                      approved by an administrator.
                    </p>
                  </div>

                  <FileCheck2
                    size={23}
                    className="shrink-0 text-[#1769AA]"
                  />
                </div>

                {requirements.length === 0 ? (
                  <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    No document requirements are currently configured
                    for this property.
                  </p>
                ) : (
                  <>
                    <div className="mt-5 rounded-xl bg-gray-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          Required documents approved
                        </p>

                        <p className="text-sm font-bold text-[#1769AA]">
                          {checklistStats.approved} / {checklistStats.total}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-[#159447] transition-all"
                          style={{
                            width: `${
                              checklistStats.total
                                ? (checklistStats.approved /
                                    checklistStats.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {checklistStats.outstanding} required document
                        {checklistStats.outstanding === 1 ? "" : "s"}{" "}
                        awaiting approval.
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {requirements.map((requirement) => {
                        const state = getRequirementState(
                          requirement,
                          documents
                        );

                        const StateIcon = state.icon;

                        return (
                          <article
                            key={requirement.documentType}
                            className="rounded-xl border border-gray-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <StateIcon
                                  size={20}
                                  className={`mt-0.5 shrink-0 ${state.color}`}
                                />

                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900">
                                    {requirement.label}
                                  </p>

                                  {requirement.description && (
                                    <p className="mt-1 text-sm leading-5 text-gray-500">
                                      {requirement.description}
                                    </p>
                                  )}

                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                      status={state.status}
                                      label={state.label}
                                    />

                                    <span className="text-xs font-medium text-gray-500">
                                      {requirement.required
                                        ? "Required"
                                        : "Optional"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {documents
                              .filter(
                                (document) =>
                                  document.documentType ===
                                  requirement.documentType
                              )
                              .filter((document) => document.reviewNote)
                              .map((document) => (
                                <p
                                  key={document._id}
                                  className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
                                >
                                  <strong>Reviewer feedback:</strong>{" "}
                                  {document.reviewNote}
                                </p>
                              ))}
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    Upload documents
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    PDF, JPG, PNG or WebP · Maximum 10 MB per file ·
                    Up to 15 documents per case.
                  </p>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label
                      htmlFor="due-diligence-type"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Document type
                    </label>

                    <select
                      id="due-diligence-type"
                      value={documentType}
                      onChange={(event) =>
                        setDocumentType(event.target.value)
                      }
                      disabled={uploadOptions.length === 0}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#159447] focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                    >
                      {uploadOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                          {item.required ? " (Required)" : " (Optional)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="due-diligence-file"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Select document
                    </label>

                    <input
                      id="due-diligence-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setFile(event.target.files?.[0] || null)
                      }
                      className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-green-800 hover:file:bg-green-100"
                    />

                    {file && (
                      <p className="mt-2 text-xs text-gray-500">
                        {file.name} ·{" "}
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="due-diligence-note"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Note (optional)
                    </label>

                    <textarea
                      id="due-diligence-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Add context for the reviewer..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#159447] focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      uploading ||
                      !file ||
                      !selectedPropertyId ||
                      !documentType
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159447] px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      <RefreshCw size={17} className="animate-spin" />
                    ) : (
                      <Upload size={17} />
                    )}

                    {uploading
                      ? "Uploading securely..."
                      : "Upload document"}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Submitted documents
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {documents.length} document
                      {documents.length === 1 ? "" : "s"} on this case
                    </p>
                  </div>

                  <FileCheck2
                    size={23}
                    className="text-[#1769AA]"
                  />
                </div>

                {documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-9 text-center">
                    <FileText
                      size={28}
                      className="mx-auto text-gray-400"
                    />

                    <p className="mt-3 text-sm font-medium text-gray-600">
                      No documents submitted yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => {
                      const requirement = requirements.find(
                        (item) =>
                          item.documentType === document.documentType
                      );

                      return (
                        <article
                          key={document._id}
                          className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                              <FileText size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-gray-900">
                                {document.originalName ||
                                  "Uploaded document"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {requirement?.label ||
                                  (document.documentType === "other"
                                    ? "Other supporting document"
                                    : formatPropertyType(
                                        document.documentType
                                      ))}
                              </p>

                              <div className="mt-2">
                                <Badge status={document.status} />
                              </div>

                              {document.reviewNote && (
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-amber-800">
                                  {document.reviewNote}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openDocument(document._id)
                            }
                            disabled={
                              openingDocumentId === document._id
                            }
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-60"
                          >
                            {openingDocumentId === document._id ? (
                              <RefreshCw
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <ExternalLink size={15} />
                            )}

                            Open securely
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}


