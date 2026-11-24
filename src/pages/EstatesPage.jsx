



import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { api } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageSkeleton } from "../components/ui/LoadingState.jsx";

const PAGE_LIMIT = 12;
const FEATURED_LIMIT = 3;

const ESTATE_TYPES = [
  { value: "", label: "All estate types" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed use" },
];

const DEVELOPMENT_STATUSES = [
  { value: "", label: "All development stages" },
  { value: "under_construction", label: "Under construction" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

const selectStyles =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const initialPagination = {
  total: 0,
  page: 1,
  limit: PAGE_LIMIT,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatLabel(value = "") {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getEstateCover(estate) {
  return typeof estate.coverImage === "string"
    ? estate.coverImage
    : estate.coverImage?.url || "";
}

function getEstateProgress(estate) {
  return Math.min(
    100,
    Math.max(0, Number(estate.construction?.progressPercentage) || 0),
  );
}

function getEstateLocation(estate) {
  return [
    estate.location?.area,
    estate.location?.city,
    estate.location?.state,
  ]
    .filter(Boolean)
    .join(", ");
}

function EstateCard({ estate }) {
  const progress = getEstateProgress(estate);
  const completed = estate.developmentStatus === "completed";
  const coverImage = getEstateCover(estate);
  const detailsUrl = `/estates/${encodeURIComponent(estate.slug)}`;
  const location = getEstateLocation(estate);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        to={detailsUrl}
        aria-label={`Explore ${estate.name}`}
        className="block"
      >
        <div
          className={`relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 ${
            coverImage ? "" : "text-emerald-700"
          }`}
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt={estate.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <Building2 size={52} strokeWidth={1.2} />
          )}

          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
              completed
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {formatLabel(estate.developmentStatus)}
          </span>
        </div>
      </Link>

      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <Building2 size={15} />
          {formatLabel(estate.estateType)}
        </div>

        <h3 className="mb-3 font-serif text-2xl font-medium text-slate-800">
          <Link to={detailsUrl} className="transition hover:text-emerald-700">
            {estate.name}
          </Link>
        </h3>

        {location && (
          <p className="mb-4 flex items-start gap-2 text-sm leading-relaxed text-slate-500">
            <MapPin size={17} className="mt-0.5 shrink-0 text-amber-600" />
            {location}
          </p>
        )}

        {estate.description && (
          <p className="mb-5 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">
            {estate.description}
          </p>
        )}

        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">Development progress</span>
          <strong className="text-emerald-700">{progress}%</strong>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label={`${estate.name} development progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            {completed ? (
              <CheckCircle2 size={15} className="text-emerald-600" />
            ) : (
              <Clock3 size={15} className="text-amber-600" />
            )}
            {completed ? "Completed estate" : "Development update"}
          </span>

          <Link
            to={detailsUrl}
            className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-emerald-700 transition hover:gap-3 hover:text-blue-700"
          >
            Explore <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function DevelopmentSection({
  title,
  description,
  estates,
  total,
  type,
  icon: Icon,
  accent,
  onViewAll,
}) {
  const isCompleted = type === "completed";

  return (
    <section className="mt-16">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className={`mb-3 flex items-center gap-2 text-sm font-bold ${accent}`}>
            <Icon size={19} />
            <span className="uppercase tracking-wider">{title}</span>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-500">
            {description}
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            {total} {total === 1 ? "estate" : "estates"} available
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 transition hover:border-emerald-600 hover:bg-emerald-50"
        >
          View all <ArrowRight size={16} />
        </button>
      </div>

      {estates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {estates.map((estate) => (
            <EstateCard key={estate._id} estate={estate} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          {isCompleted ? (
            <CheckCircle2 size={30} className="mx-auto text-emerald-600" />
          ) : (
            <Clock3 size={30} className="mx-auto text-amber-600" />
          )}

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No {isCompleted ? "completed" : "under-construction"} estates are
            currently available.
          </p>
        </div>
      )}
    </section>
  );
}

export default function EstatesPage() {
  const { error: showError } = useToast();

  const [estates, setEstates] = useState([]);
  const [underConstruction, setUnderConstruction] = useState([]);
  const [completedEstates, setCompletedEstates] = useState([]);

  const [categoryTotals, setCategoryTotals] = useState({
    underConstruction: 0,
    completed: 0,
  });

  const [pagination, setPagination] = useState(initialPagination);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [estateType, setEstateType] = useState("");
  const [developmentStatus, setDevelopmentStatus] = useState("");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const fetchEstates = useCallback(
    async (signal) => {
      setLoading(true);
      setRequestError("");

      try {
        const [mainResponse, constructionResult, completedResult] =
          await Promise.all([
            api.getPublicEstates({
              search,
              estateType,
              developmentStatus,
              page: pagination.page,
              limit: PAGE_LIMIT,
              sort,
            }),
            api.getPublicEstates({
              page: 1,
              limit: FEATURED_LIMIT,
              developmentStatus: "under_construction",
              sort: "newest",
            }),
            api.getPublicEstates({
              page: 1,
              limit: FEATURED_LIMIT,
              developmentStatus: "completed",
              sort: "newest",
            }),
          ]);

        if (signal.aborted) return;

        setEstates(
          Array.isArray(mainResponse.data) ? mainResponse.data : [],
        );

        setPagination((current) => ({
          ...current,
          ...(mainResponse.pagination || {}),
        }));

        setUnderConstruction(
          Array.isArray(constructionResult.data)
            ? constructionResult.data
            : [],
        );

        setCompletedEstates(
          Array.isArray(completedResult.data)
            ? completedResult.data
            : [],
        );

        setCategoryTotals({
          underConstruction: constructionResult.pagination?.total ?? 0,
          completed: completedResult.pagination?.total ?? 0,
        });
      } catch (err) {
        if (signal.aborted) return;

        const message =
          err.message || "Unable to load estates. Please try again.";

        setRequestError(message);
        setEstates([]);
        setUnderConstruction([]);
        setCompletedEstates([]);
        showError(message);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      search,
      estateType,
      developmentStatus,
      pagination.page,
      sort,
      retryCount,
      showError,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchEstates(controller.signal);

    return () => controller.abort();
  }, [fetchEstates]);

  const applySearch = (event) => {
    event.preventDefault();

    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    setSearch(searchInput.trim());
  };

  const changeFilter = (setter, value) => {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    setter(value);
  };

  const changePage = (page) => {
    setPagination((current) => ({
      ...current,
      page,
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setEstateType("");
    setDevelopmentStatus("");
    setSort("newest");

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const retryRequest = () => {
    setRetryCount((current) => current + 1);
  };

  const showDevelopmentType = (value) => {
    setSearchInput("");
    setSearch("");
    setEstateType("");
    setDevelopmentStatus(value);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    document.getElementById("estate-listings")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(estateType) ||
    Boolean(developmentStatus);

  if (loading && estates.length === 0 && !requestError) {
    return <PageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-[#fffefa]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-blue-800 px-5 py-24 text-white sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-72 w-72 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-7xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            AMANAH ESTATES · DEVELOPMENT SHOWCASE
          </span>

          <h1 className="mt-7 max-w-4xl font-serif text-5xl font-medium leading-tight sm:text-6xl lg:text-7xl">
            Discover estates.
            <br />
            <span className="text-amber-300">
              See the vision take shape.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
            Explore exceptional property developments, follow construction
            progress and discover completed estates through Amanah Estates.
          </p>

          <a
            href="#estate-listings"
            className="mt-9 inline-flex items-center gap-3 rounded-lg bg-amber-300 px-6 py-4 text-sm font-bold text-emerald-950 transition hover:-translate-y-1 hover:bg-white"
          >
            Explore developments
            <ArrowRight size={17} />
          </a>
        </div>
      </section>

      {/* Development categories */}
      {!requestError && (
        <section className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 lg:pt-20">
          <div className="mb-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              DEVELOPMENT JOURNEY
            </span>

            <h2 className="mt-3 font-serif text-4xl font-medium text-slate-800 sm:text-5xl">
              Explore by development stage
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Follow projects as they progress from active construction to
              completed developments.
            </p>
          </div>

          <DevelopmentSection
            title="Under Construction"
            description="Follow active developments and see the latest construction progress."
            estates={underConstruction}
            total={categoryTotals.underConstruction}
            type="under_construction"
            icon={Clock3}
            accent="text-amber-700"
            onViewAll={() => showDevelopmentType("under_construction")}
          />

          <DevelopmentSection
            title="Completed Estates"
            description="Explore developments that have reached completion."
            estates={completedEstates}
            total={categoryTotals.completed}
            type="completed"
            icon={CheckCircle2}
            accent="text-emerald-700"
            onViewAll={() => showDevelopmentType("completed")}
          />
        </section>
      )}

      {/* Main estate directory */}
      <section
        id="estate-listings"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24"
      >
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              OUR DEVELOPMENTS
            </span>

            <h2 className="mt-3 font-serif text-4xl font-medium text-slate-800 sm:text-5xl">
              All estate listings
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Find developments by location, property type or construction
              stage.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-emerald-800">
            <Building2 size={19} />
            {pagination.total}{" "}
            {pagination.total === 1 ? "estate" : "estates"}
          </div>
        </div>

        {/* Filters */}
        <form
          onSubmit={applySearch}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 px-4 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
              <Search size={19} className="shrink-0 text-emerald-700" />

              <input
                type="search"
                placeholder="Search estate name, city or location..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                aria-label="Search estates"
                className="min-h-12 w-full min-w-0 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-8 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Search estates
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Estate type
              </span>

              <select
                value={estateType}
                onChange={(event) =>
                  changeFilter(setEstateType, event.target.value)
                }
                className={selectStyles}
              >
                {ESTATE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Development stage
              </span>

              <select
                value={developmentStatus}
                onChange={(event) =>
                  changeFilter(setDevelopmentStatus, event.target.value)
                }
                className={selectStyles}
              >
                {DEVELOPMENT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Sort by
              </span>

              <select
                value={sort}
                onChange={(event) => changeFilter(setSort, event.target.value)}
                className={selectStyles}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 text-xs font-bold text-amber-700 transition hover:text-emerald-800"
            >
              Clear all filters
            </button>
          )}
        </form>

        <div className="my-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={15} />
            {hasFilters ? "Filtered estate results" : "All published estates"}
          </span>

          {loading && (
            <span className="font-medium text-emerald-700">
              Updating listings...
            </span>
          )}
        </div>

        {/* Error state */}
        {requestError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-16 text-center">
            <Building2 size={38} className="mx-auto text-amber-700" />

            <h3 className="mt-5 font-serif text-2xl text-slate-800">
              We couldn't load the estates
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
              {requestError}
            </p>

            <button
              type="button"
              onClick={retryRequest}
              className="mt-6 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Try again
            </button>
          </div>
        ) : estates.length > 0 ? (
          <>
            <div
              className={`grid grid-cols-1 gap-6 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${
                loading ? "opacity-60" : "opacity-100"
              }`}
            >
              {estates.map((estate) => (
                <EstateCard key={estate._id} estate={estate} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <nav
                aria-label="Estate listing pages"
                className="mt-14 flex flex-wrap items-center justify-center gap-4"
              >
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => changePage(pagination.page - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-xs font-medium text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => changePage(pagination.page + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <Building2 size={40} className="mx-auto text-emerald-700" />

            <h3 className="mt-5 font-serif text-2xl text-slate-800">
              No estates found
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              There are currently no published estates matching your search.
              Try changing your filters.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-lg bg-emerald-700 px-6 py-3 
                text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                View all estates
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
