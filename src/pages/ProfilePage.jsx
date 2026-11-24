
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function ProfilePage() {
  const { user, token, updateUser  } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || ""
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const result = await api.updateProfile(form, token);

      updateUser(result.user);
      
      setForm({
        firstName: result.user.firstName || "",
        lastName: result.user.lastName || "",
        phone: result.user.phone || ""
      });

      setMessage(result.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-green-700"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-green-700">
            Account settings
          </p>

          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 text-gray-600">
            Manage your personal information and account details.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <User size={30} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {fullName || "Account holder"}
            </h2>

            <p className="mt-1 break-all text-sm text-gray-500">
              {user?.email}
            </p>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck
                  size={18}
                  className={
                    user?.isEmailVerified
                      ? "text-green-600"
                      : "text-amber-500"
                  }
                />

                <span className="text-gray-700">
                  {user?.isEmailVerified
                    ? "Email verified"
                    : "Email not verified"}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Account role: {user?.role || "user"}
              </p>
            </div>
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">
              Personal information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the information associated with your account.
            </p>

            {message && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    autoComplete="given-name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    autoComplete="family-name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-500 outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Your email address cannot be changed here.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone number
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={30}
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
