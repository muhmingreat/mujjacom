import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function ChangePasswordPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleVisibility(field) {
    setVisible((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword.length < 8 || form.newPassword.length > 72) {
      setError("Your new password must contain between 8 and 72 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Your new password and confirmation do not match.");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError(
        "Your new password must be different from your current password.",
      );
      return;
    }

    setSaving(true);

    try {
      const result = await api.changePassword(form, token);

      logout();

      navigate("/login", {
        replace: true,
        state: {
          message:
            result.message ||
            "Password changed successfully. Please sign in with your new password.",
        },
      });

      setMessage(result.message || "Password changed successfully.");

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Unable to change your password.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    {
      name: "currentPassword",
      label: "Current password",
      placeholder: "Enter your current password",
    },
    {
      name: "newPassword",
      label: "New password",
      placeholder: "Enter your new password",
    },
    {
      name: "confirmPassword",
      label: "Confirm new password",
      placeholder: "Re-enter your new password",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-green-700"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-green-700">
            Security settings
          </p>

          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Change Password
          </h1>

          <p className="mt-2 text-gray-600">
            Update your password to help keep your account secure.
          </p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4 rounded-xl bg-green-50 p-4">
            <div className="rounded-lg bg-green-100 p-2 text-green-700">
              <ShieldCheck size={23} />
            </div>

            <div>
              <h2 className="font-semibold text-green-900">
                Account protection
              </h2>

              <p className="mt-1 text-sm text-green-800">
                Choose a password that is difficult for others to guess. Your
                password must contain at least 8 characters.
              </p>
            </div>
          </div>

          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  {field.label}
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id={field.name}
                    name={field.name}
                    type={visible[field.name] ? "text" : "password"}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required
                    minLength={field.name !== "currentPassword" ? 8 : undefined}
                    maxLength={72}
                    autoComplete={
                      field.name === "currentPassword"
                        ? "current-password"
                        : "new-password"
                    }
                    className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-12 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <button
                    type="button"
                    onClick={() => toggleVisibility(field.name)}
                    aria-label={
                      visible[field.name] ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-green-700"
                  >
                    {visible[field.name] ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update password
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
