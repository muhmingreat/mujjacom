
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SavePropertyButton({ propertyId }) {
  const { token, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSavedStatus() {
      if (loading) return;

      if (!isAuthenticated || !token || !propertyId) {
        if (active) {
          setSaved(false);
          setChecking(false);
        }
        return;
      }

      try {
        const result = await api.getSavedProperties(token);

        if (active) {
          setSaved(
            (result.data || []).some(
              property => String(property._id) === String(propertyId)
            )
          );
        }
      } catch {
        if (active) setError("Unable to check saved status.");
      } finally {
        if (active) setChecking(false);
      }
    }

    setChecking(true);
    checkSavedStatus();

    return () => {
      active = false;
    };
  }, [propertyId, token, isAuthenticated, loading]);

  async function handleSave() {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: location, message: "Please sign in to save properties." }
      });
      return;
    }

    if (!token || saving || checking) return;

    setSaving(true);
    setError("");

    try {
      if (saved) {
        await api.unsaveProperty(propertyId, token);
        setSaved(false);
      } else {
        await api.saveProperty(propertyId, token);
        setSaved(true);
      }
    } catch (err) {
      setError(err.message || "Unable to update saved property.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || checking || saving}
        aria-label={saved ? "Remove saved property" : "Save property"}
        aria-pressed={saved}
        title={saved ? "Remove from saved properties" : "Save property"}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
          saved
            ? "border-green-700 bg-green-50 text-green-800"
            : "border-gray-300 bg-white text-gray-700 hover:border-green-700 hover:text-green-800"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <Bookmark
          size={17}
          fill={saved ? "currentColor" : "none"}
        />
        {loading || checking
          ? "Checking..."
          : saving
            ? "Updating..."
            : saved
              ? "Saved"
              : "Save property"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
