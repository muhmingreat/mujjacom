import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileText,
  Heart,
  ShieldCheck,
  UserCircle,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const overviewCards = [
  {
    title: "Saved properties",
    description: "Keep track of properties you are interested in.",
    status: "View saved properties",
    icon: Heart,
    color: "text-red-500",
    background: "bg-red-50",
    path: "/dashboard/saved-properties",
  },
  {
    title: "My applications",
    description: "Follow the progress of your property applications.",
    status: "Track your applications",
    icon: FileText,
    color: "text-blue-600",
    background: "bg-blue-50",
    path: "/dashboard/applications",
  },
  {
    title: "Transactions",
    description: "View your property transaction history.",
    status: "Coming soon",
    icon: Wallet,
    color: "text-amber-600",
    background: "bg-amber-50",
    path: "/dashboard/transactions",
  },
];

export default function DashboardOverview() {
  const { user } = useAuth();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const isVerified = Boolean(user?.isEmailVerified);

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#159447] to-[#1769AA] p-6 text-white shadow-sm sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/80">
            Member dashboard
          </p>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Welcome back, {user?.firstName || "Member"}!
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
            Manage your account, explore property opportunities and keep track
            of your activities with AMANAH ESTATES.
          </p>

          <Link
            to="/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#159447] transition hover:-translate-y-0.5 hover:bg-gray-100"
          >
            Explore properties
            <ArrowRight size={17} />
          </Link>
        </div>

        <Building2
          size={180}
          strokeWidth={0.7}
          className="absolute -bottom-12 -right-8 hidden text-white/15 sm:block"
        />
      </section>

      {/* Account verification */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-xl p-3 ${
                isVerified
                  ? "bg-green-50 text-[#159447]"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {isVerified ? (
                <ShieldCheck size={23} />
              ) : (
                <AlertCircle size={23} />
              )}
            </div>

            <div>
              <h2 className="font-bold text-gray-900">Email verification</h2>

              <p className="mt-1 text-sm text-gray-500">
                {isVerified
                  ? "Your email address has been verified."
                  : "Please verify your email address to secure your account."}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
              isVerified
                ? "bg-green-50 text-[#159447]"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {isVerified ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            {isVerified ? "Verified" : "Not verified"}
          </span>
        </div>
      </section>

      {/* Activity overview */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            Your property activity
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Your personal property management space.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {overviewCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                to={card.path}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-xl p-3 ${card.background} ${card.color}`}
                  >
                    <Icon size={23} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#159447]"
                  />
                </div>

                <h3 className="mt-5 font-bold text-gray-900">{card.title}</h3>

                <p className="mt-2 min-h-10 text-sm leading-6 text-gray-500">
                  {card.description}
                </p>

                <p className="mt-4 text-xs font-semibold text-[#1769AA]">
                  {card.status}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Account information */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Account information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your registered account details.
            </p>
          </div>

          <UserCircle size={25} className="text-[#1769AA]" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Full name
            </p>
            <p className="mt-2 font-medium text-gray-800">
              {fullName || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Email address
            </p>
            <p className="mt-2 break-all font-medium text-gray-800">
              {user?.email || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Phone number
            </p>
            <p className="mt-2 font-medium text-gray-800">
              {user?.phone || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Account status
            </p>
            <p className="mt-2 font-medium capitalize text-gray-800">
              {user?.accountStatus || "Not available"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Account role
            </p>
            <p className="mt-2 font-medium capitalize text-gray-800">
              {user?.role || "User"}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <Link
            to="/dashboard/profile"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#159447] transition hover:text-[#1769AA]"
          >
            Manage your profile
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
