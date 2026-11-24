
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, UserPlus } from "lucide-react";
import { api } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { success, error: showError, warning } = useToast();
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
 

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
  event.preventDefault();

  if (form.password.length < 8) {
    warning("Password must contain at least 8 characters.");
    return;
  }

  if (form.password.length > 72) {
    warning("Password must not exceed 72 characters.");
    return;
  }

  if (form.password !== form.confirmPassword) {
    warning("Your passwords do not match.");
    return;
  }

  setLoading(true);

  try {
    await api.register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password
    });

    success(
      "Your account has been created. Please verify your email address."
    );

    navigate(
      `/verify-email?email=${encodeURIComponent(
        form.email.trim().toLowerCase()
      )}`,
      { state: { registered: true } }
    );
  } catch (err) {
    if (err.code === "VERIFICATION_EMAIL_FAILED") {
      warning(
        "Your account was created, but the verification email could not be sent. Please use the resend verification option.",
        { duration: 15000 }
      );
    } else {
      showError(
        err.message || "Registration failed. Please try again."
      );
    }
  } finally {
    setLoading(false);
  }
}

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-100 shadow-xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-green-700 p-12 text-white lg:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em]">
              Amanah Estates
            </p>

            <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight">
              Find a place to call home.
            </h1>

            <p className="mt-5 max-w-md leading-7 text-green-50">
              Create your account to explore properties, connect with
              property professionals and manage your real estate journey.
            </p>
          </div>

          <p className="text-sm text-green-100">
            A better way to discover property opportunities.
          </p>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <UserPlus size={23} />
            </div>

            <h2 className="text-3xl font-bold text-gray-900">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Join Amanah Estates and get started.
            </p>
          </div>

          {/* {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )} */}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  className={inputClass}
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  className={inputClass}
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                className={inputClass}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                className={inputClass}
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Your phone number"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                className={inputClass}
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-green-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
