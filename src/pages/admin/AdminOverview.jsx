
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardCheck,
  Users,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  Clock3
} from "lucide-react";

const managementCards = [
  {
    title: "Property management",
    description: "View and manage property listings across the platform.",
    path: "/admin/properties",
    icon: Building2,
    color: "green"
  },
  {
    title: "Property reviews",
    description: "Inspect submitted properties and manage approval decisions.",
    path: "/admin/property-reviews",
    icon: ClipboardCheck,
    color: "blue"
  },
  {
    title: "Applications",
    description: "Review property purchase, rental and lease applications.",
    path: "/admin/applications",
    icon: FileText,
    color: "yellow"
  },
  {
    title: "Members",
    description: "View and manage registered platform members.",
    path: "/admin/members",
    icon: Users,
    color: "red"
  }
];

const iconStyles = {
  green: "bg-green-50 text-[#159447]",
  blue: "bg-blue-50 text-[#1769AA]",
  yellow: "bg-yellow-50 text-[#a77b00]",
  red: "bg-red-50 text-[#D93636]"
};

export default function AdminOverview() {
  return (
    <div className="space-y-8">

      {/* Welcome section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#159447] to-[#1769AA] p-6 text-white shadow-sm sm:p-9">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <ShieldCheck size={15} />
            Administrative workspace
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome to AMANAH ESTATES
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
            Manage property submissions, review applications and oversee
            platform activities from your administration workspace.
          </p>

          <Link
            to="/admin/property-reviews"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#159447] transition hover:bg-gray-100"
          >
            Review properties
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <Building2
          size={180}
          className="absolute -bottom-12 -right-8 text-white/10"
          strokeWidth={1}
        />
      </section>

      {/* Management cards */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Platform management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose an area to manage.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {managementCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.path}
                to={card.path}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconStyles[card.color]}`}>
                    <Icon size={23} />
                  </div>

                  <ArrowUpRight
                    size={19}
                    className="text-gray-300 transition group-hover:text-[#159447]"
                  />
                </div>

                <h3 className="mt-5 font-bold text-gray-900">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Review reminder */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#1769AA]">
            <Clock3 size={23} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">
              Property review centre
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Review submitted properties carefully before approving
              publication. Check the property information and uploaded
              media before making a decision.
            </p>

            <Link
              to="/admin/property-reviews"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1769AA] hover:underline"
            >
              Open review centre
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
