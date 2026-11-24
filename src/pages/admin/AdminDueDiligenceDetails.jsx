
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  MapPin,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";

const REVIEW_ACTIONS = [
  {
    status: "approved",
    label: "Approve",
    icon: CheckCircle2,
    className:
      "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
  },
  {
    status: "needs_correction",
    label: "Needs correction",
    icon: AlertCircle,
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    status: "rejected",
    label: "Reject",
    icon: XCircle,
    className:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
];

const STATUS_STYLE = {
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  needs_correction: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
  under_review: "bg-amber-50 text-amber-700",
  verified: "bg-green-50 text-green-700",
};

const formatStatus = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const formatDocumentType = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );

export default function AdminDueDiligenceDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();

  const [caseRecord, setCaseRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState("");
  const [reviewingDocumentId, setReviewingDocumentId] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [reviewStatus, setReviewStatus] = useState({});

  const loadCase = useCallback(
    async (refresh = false) => {
      if (!token || !caseId) return;

      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.getAdminDueDiligenceCase(
          caseId,
          token
        );

        setCaseRecord(response.data || null);
      } catch (error) {
        toast.error(
          error.message || "Unable to load this due diligence case."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [caseId, token]
  );

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const openDocument = async (document) => {
    try {
      setOpeningDocumentId(document._id);

      const response =
        await api.getAdminDueDiligenceDocumentAccess(
          caseId,
          document._id,
          token
        );

      const url = response?.data?.url;

      if (!url) {
        throw new Error("The document access link was not returned.");
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error.message || "Unable to open this document.");
    } finally {
      setOpeningDocumentId("");
    }
  };

  const reviewDocument = async (document) => {
    const status = reviewStatus[document._id];

    if (!status) {
      toast.warning("Choose a review action first.");
      return;
    }

    const reviewNote = reviewNotes[document._id] || "";

    if (
      status !== "approved" &&
      !reviewNote.trim()
    ) {
      toast.warning(
        "Please provide a review note for this decision."
      );
      return;
    }

    try {
      setReviewingDocumentId(document._id);

      await api.reviewAdminDueDiligenceDocument(
        caseId,
        document._id,
        {
          status,
          reviewNote,
        },
        token
      );

      toast.success("Document review saved.");

      setReviewStatus((current) => ({
        ...current,
        [document._id]: "",
      }));

      setReviewNotes((current) => ({
        ...current,
        [document._id]: "",
      }));

      await loadCase(true);
    } catch (error) {
      toast.error(error.message || "Unable to save document review.");
    } finally {
      setReviewingDocumentId("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!caseRecord) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <FileText size={40} className="mx-auto text-slate-300" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Due diligence case not found
        </h2>
        <button
          type="button"
          onClick={() => navigate("/admin/due-diligence")}
          className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          Back to cases
        </button>
      </div>
    );
  }

  const property = caseRecord.property || {};
  const owner = caseRecord.owner || {};
  const documents = caseRecord.documents || [];
  const requirements = caseRecord.requiredDocuments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/due-diligence")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-green-700"
          >
            <ArrowLeft size={16} />
            Back to cases
          </button>

          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Due diligence review
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {property.title || "Property verification"}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => loadCase(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh case
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              STATUS_STYLE[caseRecord.status] ||
              "bg-slate-100 text-slate-600"
            }`}
          >
            {formatStatus(caseRecord.status)}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {formatStatus(
              property.transactionType ||
                caseRecord.transactionType ||
                "Transaction"
            )}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {formatStatus(
              property.propertyType ||
                caseRecord.propertyType ||
                "Property"
            )}
          </span>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h2 className="font-bold text-slate-900">
              Property information
            </h2>

            <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
              <MapPin size={17} className="mt-0.5 shrink-0" />
              {[
                property.location?.address,
                property.location?.area,
                property.location?.city,
                property.location?.state,
                property.location?.country,
              ]
                .filter(Boolean)
                .join(", ") || "Location unavailable"}
            </p>
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Property owner
            </h2>

            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <UserRound size={17} />
              {owner.name || "Unknown owner"}
            </p>

            <p className="mt-2 break-all text-sm text-slate-600">
              {owner.email || "Email unavailable"}
            </p>
          </div>
        </div>

        {caseRecord.adminNote && (
          <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
              Latest case review note
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">
              {caseRecord.adminNote}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Required documents
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Checklist configured for this property and transaction.
            </p>
          </div>

          <span className="text-sm font-semibold text-slate-600">
            {requirements.length} requirement(s)
          </span>
        </div>

        {requirements.length === 0 ? (
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            No document requirements are configured for this case.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {requirements.map((requirement, index) => {
              const matchingDocuments = documents.filter(
                (document) =>
                  document.documentType === requirement.documentType
              );

              const approved = matchingDocuments.some(
                (document) => document.status === "approved"
              );

              return (
                <div
                  key={`${requirement.documentType}-${index}`}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {requirement.label ||
                        formatDocumentType(requirement.documentType)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {requirement.required ? "Required" : "Optional"}
                      {requirement.description
                        ? ` · ${requirement.description}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${
                      approved
                        ? "bg-green-50 text-green-700"
                        : matchingDocuments.length
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {approved
                      ? "Approved"
                      : matchingDocuments.length
                      ? "Submitted"
                      : "Not submitted"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Submitted documents
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Open each document, select a decision, and save your review.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <FileText
              size={40}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 font-semibold text-slate-800">
              No documents submitted yet
            </p>
          </div>
        ) : (
          documents.map((document) => {
            const selectedStatus =
              reviewStatus[document._id] || "";

            const note = reviewNotes[document._id] || "";

            return (
              <article
                key={document._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-green-50 p-3 text-green-700">
                      <FileText size={22} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-slate-900">
                        {document.originalName ||
                          formatDocumentType(document.documentType)}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDocumentType(document.documentType)}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Submitted {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`self-start rounded-full px-3 py-1.5 text-xs font-semibold ${
                      STATUS_STYLE[document.status] ||
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {formatStatus(document.status || "submitted")}
                  </span>
                </div>

                {document.note && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Owner's note
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {document.note}
                    </p>
                  </div>
                )}

                {document.reviewNote && (
                  <div className="mt-3 rounded-xl bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800">
                      Previous review note
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
                      {document.reviewNote}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openDocument(document)}
                  disabled={openingDocumentId === document._id}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-green-300 hover:bg-green-50 disabled:opacity-60"
                >
                  <ExternalLink size={16} />
                  {openingDocumentId === document._id
                    ? "Opening document..."
                    : "View document"}
                </button>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-sm font-bold text-slate-800">
                    Review decision
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {REVIEW_ACTIONS.map((action) => {
                      const Icon = action.icon;

                      return (
                        <button
                          key={action.status}
                          type="button"
                          onClick={() =>
                            setReviewStatus((current) => ({
                              ...current,
                              [document._id]: action.status,
                            }))
                          }
                          disabled={
                            reviewingDocumentId === document._id
                          }
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                            action.className
                          } ${
                            selectedStatus === action.status
                              ? "ring-2 ring-offset-1 ring-slate-400"
                              : ""
                          }`}
                        >
                          <Icon size={16} />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-slate-700">
                      Review note
                      {selectedStatus !== "approved" && (
                        <span className="text-red-600"> *</span>
                      )}
                    </span>

                    <textarea
                      value={note}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [document._id]: event.target.value,
                        }))
                      }
                      rows={3}
                      maxLength={2000}
                      placeholder="Explain your decision or tell the owner what needs attention..."
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </label>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-400">
                      {note.length}/2000 characters
                    </p>

                    <button
                      type="button"
                      onClick={() => reviewDocument(document)}
                      disabled={
                        !selectedStatus ||
                        reviewingDocumentId === document._id
                      }
                      className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reviewingDocumentId === document._id
                        ? "Saving review..."
                        : "Save review"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
