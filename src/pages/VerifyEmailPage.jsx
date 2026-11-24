
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, ShieldCheck, ArrowLeft, LoaderCircle } from "lucide-react";
import { api } from "../services/api.js";

export default function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const attemptedToken = useRef("");

  const [status, setStatus] = useState(token ? "verifying" : "missing");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token || attemptedToken.current === token) return;

    attemptedToken.current = token;
    setStatus("verifying");

    api.verifyEmail(token)
      .then((result) => {
        setStatus("success");
        setMessage(
          result.message ||
          "Your email address has been verified successfully."
        );
        setSearchParams({}, { replace: true });
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error.message ||
          "This verification link is invalid or has expired."
        );
        setSearchParams({}, { replace: true });
      });
  }, [token, setSearchParams]);

  async function handleResend(event) {
    event.preventDefault();

    if (!email.trim()) return;

    setResendStatus("sending");
    setResendMessage("");

    try {
      const result = await api.resendVerificationEmail(email.trim());

      setResendStatus("sent");
      setResendMessage(
        result.message ||
        "If an eligible unverified account exists, a verification email will be sent."
      );
    } catch (error) {
      setResendStatus("error");
      setResendMessage(
        error.message ||
        "We could not process your request. Please try again."
      );
    }
  }

  return (
    <main className="min-h-[80vh] bg-[#f7faf8] px-4 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-lg">

        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#159447] text-2xl font-extrabold text-white shadow-lg">
            A
          </div>

          <div>
            <h2 className="text-xl font-extrabold tracking-wide text-[#111827]">
              AMANAH ESTATES
            </h2>
            <p className="text-xs font-medium tracking-widest text-[#1769AA]">
              PROPERTY. TRUST. OPPORTUNITY.
            </p>
          </div>
        </div>

        {/* Verification Card */}
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-green-900/5">

          <div className="h-1.5 bg-gradient-to-r from-[#159447] via-[#1769AA] to-[#F2C230]" />

          <div className="px-6 py-10 text-center sm:px-10 sm:py-12">

            {status === "verifying" && (
              <div aria-live="polite">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                  <LoaderCircle className="h-10 w-10 animate-spin text-[#159447]" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900">
                  Verifying your email
                </h1>

                <p className="mt-3 leading-7 text-gray-500">
                  Please wait while we securely verify your email address.
                </p>
              </div>
            )}

            {status === "success" && (
              <div aria-live="polite">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 className="h-11 w-11 text-[#159447]" />
                </div>

                <span className="mb-3 inline-block rounded-full bg-green-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#159447]">
                  Verification complete
                </span>

                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Email verified!
                </h1>

                <p className="mt-4 leading-7 text-gray-500">
                  {message}
                </p>

                <Link
                  to="/"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#159447] px-6 py-4 font-semibold text-white transition duration-200 hover:bg-[#117a3a] hover:shadow-lg hover:shadow-green-900/15"
                >
                  Continue to homepage
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            )}

            {(status === "error" || status === "missing") && (
              <div aria-live="polite">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle className="h-11 w-11 text-[#D93636]" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {status === "missing"
                    ? "Verification link missing"
                    : "Verification unsuccessful"}
                </h1>

                <p className="mt-3 leading-7 text-gray-500">
                  {status === "missing"
                    ? "We could not find a verification token in this link."
                    : message}
                </p>

                <div className="my-8 border-t border-gray-100" />

                <div className="mb-6 text-left">
                  <h2 className="text-lg font-bold text-gray-900">
                    Request a new verification email
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Enter the email address you used to create your account.
                  </p>
                </div>

                <form onSubmit={handleResend} className="space-y-4 text-left">
                  <div>
                    <label
                      htmlFor="verification-email"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Email address
                    </label>

                    <input
                      id="verification-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#159447] focus:bg-white focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resendStatus === "sending"}
                    className="flex w-full items-center justify-center rounded-xl bg-[#1769AA] px-6 py-4 font-semibold text-white transition duration-200 hover:bg-[#12558c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resendStatus === "sending"
                      ? "Sending..."
                      : "Resend verification email"}
                  </button>
                </form>

                {resendMessage && (
                  <p
                    role="status"
                    className={`mt-4 rounded-xl p-3 text-sm leading-6 ${
                      resendStatus === "error"
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-800"
                    }`}
                  >
                    {resendMessage}
                  </p>
                )}

                <Link
                  to="/"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#159447]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to homepage
                </Link>
              </div>
            )}
          </div>

          {/* Security Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
              <ShieldCheck className="h-4 w-4 text-[#159447]" />
              Secure account verification
            </div>
          </div>
        </section>

        <p className="mt-7 text-center text-xs leading-6 text-gray-400">
          © {new Date().getFullYear()} AMANAH ESTATES. All rights reserved.
        </p>
      </div>
    </main>
  );
}
