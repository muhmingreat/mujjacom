
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { api } from "../services/api.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Your password reset link is missing its token. Please request a new link.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError("Your password must contain between 8 and 72 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await api.resetPassword({
        token,
        newPassword,
        confirmPassword
      });

      setMessage(
        result.message ||
        "Your password has been reset successfully. Please sign in."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message ||
        "Unable to reset your password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] bg-[#f7faf8] px-4 py-16">
      <div className="mx-auto max-w-md">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1769AA] transition hover:text-[#159447]"
        >
          <ArrowLeft size={17} />
          Back to login
        </Link>

        <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-green-900/5 sm:p-9">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-[#159447]">
            <LockKeyhole size={27} />
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#159447]">
            Secure account recovery
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Create a new password for your AMANAH ESTATES account.
            Your new password must contain between 8 and 72 characters.
          </p>

          {message && (
            <div
              role="status"
              className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <div>
                <p>{message}</p>
                <Link
                  to="/login"
                  className="mt-2 inline-block font-bold underline"
                >
                  Continue to sign in
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!token && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              No reset token was found in this link.{" "}
              <Link to="/forgot-password" className="font-bold underline">
                Request a new reset link
              </Link>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                New password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter your new password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading || !token || Boolean(message)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#159447] focus:ring-4 focus:ring-green-100 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Confirm new password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your new password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading || !token || Boolean(message)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#159447] focus:ring-4 focus:ring-green-100 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token || Boolean(message)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#159447] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-700/15 transition hover:bg-[#117a3a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Resetting password...
                </>
              ) : (
                <>
                  <LockKeyhole size={17} />
                  Reset password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
