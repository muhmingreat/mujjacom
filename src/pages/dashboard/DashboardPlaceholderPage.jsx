import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

export default function DashboardPlaceholderPage({
  title = "Coming soon",
  description = "This section is being prepared and will be available in a future update."
}) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-[#159447]">
          <Construction size={30} />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#159447]">
          AMANAH ESTATES
        </p>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
          {description}
        </p>

        <Link
          to="/dashboard"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#159447] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#117b3b]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}