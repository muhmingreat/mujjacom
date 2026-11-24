import React from "react";

const SkeletonBlock = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
  />
);

export function LoadingSpinner({
  size = "md",
  label = "Loading...",
  className = "",
}) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-[3px]",
    lg: "h-10 w-10 border-4",
  };

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <span
        className={`${sizes[size] || sizes.md} animate-spin rounded-full border-emerald-900/20 border-t-[#0b3d2e]`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-8 space-y-3">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-9 w-64 max-w-full" />
        <SkeletonBlock className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm"
    >
      <SkeletonBlock className="h-52 w-full rounded-none" />

      <div className="space-y-4 p-5">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-6 w-3/4" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />

        <div className="flex items-center justify-between pt-2">
          <SkeletonBlock className="h-6 w-28" />
          <SkeletonBlock className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading table"
      className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBlock key={index} className="h-4 w-3/4" />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 border-b border-slate-100 p-4 last:border-b-0"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <SkeletonBlock
              key={columnIndex}
              className={`h-4 ${
                columnIndex === 0 ? "w-4/5" : "w-2/3"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading dashboard"
      className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-8 space-y-3">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <SkeletonBlock className="mb-4 h-4 w-24" />
            <SkeletonBlock className="h-8 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-64 w-full" />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <SkeletonBlock className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}

export function LoadingOverlay({
  label = "Please wait...",
  fullscreen = false,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        fullscreen ? "fixed inset-0 z-50" : "absolute inset-0 z-20"
      } flex items-center justify-center bg-white/80 backdrop-blur-sm`}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-lg">
        <LoadingSpinner size="lg" label={label} />
        <p className="text-sm font-medium text-[#0b3d2e]">{label}</p>
      </div>
    </div>
  );
}