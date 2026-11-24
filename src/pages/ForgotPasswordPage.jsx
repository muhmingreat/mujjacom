
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Send, LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../services/api.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const result = await api.forgotPassword({
        email: email.trim()
      });

      setMessage(
        result.message ||
        "If an account with that email exists, a password reset link will be sent."
      );
    } catch (err) {
      setError(err.message || "Unable to process your request. Please try again.");
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
            <Mail size={27} />
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#159447]">
            Account recovery
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Forgot your password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Enter the email address associated with your AMANAH ESTATES account.
            If an account exists, we will send you a secure password reset link.
          </p>

          {message && (
            <div
              role="status"
              className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <span>{message}</span>
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

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#159447] focus:ring-4 focus:ring-green-100 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#159447] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-700/15 transition hover:bg-[#117a3a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Sending request...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Send reset link
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-bold text-[#1769AA] hover:text-[#159447]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
