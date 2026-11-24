
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();
  const { success, error: showError, warning } = useToast();

  const successMessage = location.state?.message || "";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (successMessage) {
      success(successMessage);
      navigate(location.pathname, {
        replace: true,
        state: { from: location.state?.from },
      });
    }
  }, []);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      success("Welcome back! You have signed in successfully.");

      const destination = location.state?.from?.pathname || "/dashboard";

      navigate(destination, { replace: true });
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        warning(
          "Please verify your email address before signing in. You can request another verification email from the verification page.",
          { duration: 6500 }
        );
      } else {
        showError(
          err.message || "Login failed. Please check your details.",
          { duration: 5000 }
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-100 shadow-xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-green-700 p-12 text-white lg:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em]">
              Amanah Estates
            </p>

            <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight">
              Welcome back.
            </h1>

            <p className="mt-5 max-w-md leading-7 text-green-50">
              Sign in to continue exploring properties and managing your real
              estate activities.
            </p>
          </div>

          <p className="text-sm text-green-100">
            Your property journey, all in one place.
          </p>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <LogIn size={23} />
            </div>

            <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>

            <p className="mt-2 text-sm text-gray-500">
              Enter your account details to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                Password
              </label>

              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

              <div className="mt-2 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#1769AA] transition hover:text-[#159447]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-green-700 hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
