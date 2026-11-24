
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { api } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";

function formatStatus(status) {
  const labels = {
    under_construction: "Under construction",
    completed: "Completed",
    planned: "Planned development",
  };

  return labels[status] || status?.replaceAll("_", " ") || "Status unavailable";
}

function formatDate(value) {
  if (!value) return "To be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "To be announced";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 h-5 w-32 rounded bg-slate-200" />
        <div className="h-72 rounded-3xl bg-slate-200 md:h-[480px]" />
        <div className="mt-8 h-8 w-2/3 rounded bg-slate-200" />
        <div className="mt-4 h-5 w-1/2 rounded bg-slate-200" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function EstateDetailsPage() {
  const { slug } = useParams();
  const { error: showError } = useToast();

  const [estate, setEstate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchEstate = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setEstate(null);

    try {
      const response = await api.getPublicEstate(slug);

      if (!response?.success || !response?.data) {
        throw new Error("Estate details could not be found.");
      }

      setEstate(response.data);
    } catch (err) {
      const message =
        err.message || "Unable to load this estate. Please try again.";

      setLoadError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, showError]);

  useEffect(() => {
    fetchEstate();
  }, [fetchEstate]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (loadError || !estate) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Estate details unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {loadError ||
              "We could not find the estate you are looking for."}
          </p>

          <button
            type="button"
            onClick={fetchEstate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1769AA] px-5 py-3 font-semibold text-white transition hover:bg-[#12558b]"
          >
            <RefreshCw size={17} />
            Try again
          </button>

          <div className="mt-4">
            <Link
              to="/estates"
              className="text-sm font-semibold text-slate-600 hover:text-[#1769AA]"
            >
              Back to estates
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const location = estate.location || {};
  const construction = estate.construction || {};

  const gallery = [
    estate.coverImage,
    ...(estate.gallery || []).map((item) =>
      typeof item === "string" ? item : item?.url || item?.imageUrl
    ),
  ].filter(Boolean);

  const progress = Math.min(
    100,
    Math.max(0, Number(construction.progressPercentage) || 0)
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/estates"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#1769AA]"
        >
          <ArrowLeft size={17} />
          Back to estates
        </Link>

        {/* Estate cover */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-slate-200 shadow-sm">
          {estate.coverImage ? (
            <img
              src={estate.coverImage}
              alt={`${estate.name} estate`}
              className="h-[280px] w-full object-cover sm:h-[400px] lg:h-[500px]"
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center sm:h-[400px] lg:h-[500px]">
              <Building2 className="h-20 w-20 text-slate-400" />
            </div>
          )}
        </section>

        {/* Estate heading */}
        <section className="mt-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-[#1769AA]">
                {estate.estateType || "Estate"}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <Clock3 size={14} />
                {formatStatus(estate.developmentStatus)}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {estate.name}
            </h1>

            <p className="mt-4 flex items-start gap-2 text-slate-600">
              <MapPin className="mt-1 shrink-0 text-[#1769AA]" size={19} />
              <span>
                {[location.area, location.city, location.state, location.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:min-w-64">
            <p className="text-sm text-slate-500">Development progress</p>

            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">
                {progress}%
              </span>
              <span className="text-xs font-medium text-slate-500">
                Reported progress
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1769AA] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        {/* Overview and details */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                About this estate
              </h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {estate.description ||
                  "Detailed information about this estate will be available soon."}
              </p>

              {location.address && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estate address
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {location.address}
                  </p>
                </div>
              )}
            </section>

            {/* Construction information */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Building2 className="text-[#1769AA]" size={22} />
                <h2 className="text-xl font-bold text-slate-900">
                  Development information
                </h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Construction started</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(construction.startDate)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Estimated completion
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(construction.estimatedCompletionDate)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs text-slate-500">Actual completion</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(construction.actualCompletionDate)}
                  </p>
                </div>
              </div>
            </section>

            {/* Gallery */}
            {gallery.length > 1 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Estate gallery
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {gallery.slice(1).map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${estate.name} gallery ${index + 1}`}
                      loading="lazy"
                      className="h-56 w-full rounded-2xl object-cover"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Amenities */}
            {estate.amenities?.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Amenities and facilities
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {estate.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-[#1769AA]"
                      />
                      {typeof amenity === "string"
                        ? amenity
                        : amenity?.name}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Highlights */}
            {estate.highlights?.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Estate highlights
                </h2>

                <ul className="mt-5 space-y-3">
                  {estate.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                    >
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0 text-[#1769AA]"
                      />
                      {typeof highlight === "string"
                        ? highlight
                        : highlight?.title || highlight?.description}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Milestones */}
            {estate.milestones?.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-[#1769AA]" size={22} />
                  <h2 className="text-xl font-bold text-slate-900">
                    Development milestones
                  </h2>
                </div>

                <div className="mt-6 space-y-5">
                  {estate.milestones.map((milestone, index) => (
                    <div key={milestone._id || index} className="flex gap-4">
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#1769AA]" />

                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {milestone.title || milestone.name}
                        </h3>

                        {milestone.description && (
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {milestone.description}
                          </p>
                        )}

                        {milestone.date && (
                          <p className="mt-2 text-xs text-slate-500">
                            {formatDate(milestone.date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Enquiry panel */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#1769AA]" size={24} />
              <h2 className="font-bold text-slate-900">
                Interested in this estate?
              </h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Contact the AMANAH ESTATES team to enquire about this development
              and receive information about available properties.
            </p>

            <Link
              to="/contact"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1769AA] px-5 py-3 font-semibold text-white transition hover:bg-[#12558b]"
            >
              Make an enquiry
              <ArrowRight size={17} />
            </Link>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Estate information is provided for discovery purposes. Property
              availability and transaction eligibility require confirmation.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
