
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  MapPin,
  ArrowUpRight,
  Trash2,
  RefreshCw
} from "lucide-react";
import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function SavedPropertiesPage() {
  const { token } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadSavedProperties = useCallback(async () => {
    if (!token) {
      setError("Please sign in to view your saved properties.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.getSavedProperties(token);
      setProperties(result.data || []);
    } catch (err) {
      setError(err.message || "Unable to load saved properties.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSavedProperties();
  }, [loadSavedProperties]);

  async function handleRemove(propertyId) {
    if (!token || removingId) return;

    setRemovingId(propertyId);
    setError("");

    try {
      await api.unsaveProperty(propertyId, token);

      setProperties(current =>
        current.filter(property => String(property._id) !== String(propertyId))
      );
    } catch (err) {
      setError(err.message || "Unable to remove this property.");
    } finally {
      setRemovingId("");
    }
  }

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Your collection
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Saved properties
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Keep track of properties you are interested in.
          </p>
        </div>

        <Link
          to="/properties"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          Explore properties
          <ArrowUpRight size={17} />
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={loadSavedProperties}
            className="inline-flex items-center gap-2 font-semibold"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <RefreshCw className="mx-auto animate-spin text-green-700" size={28} />
          <p className="mt-4 text-sm text-gray-500">
            Loading your saved properties...
          </p>
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
            <Bookmark size={28} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-gray-900">
            No saved properties yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            When you find a property you like, save it to keep it here for
            easy access later.
          </p>

          <Link
            to="/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Browse properties
            <ArrowUpRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Bookmark size={16} className="text-green-700" />
            {properties.length} saved {properties.length === 1 ? "property" : "properties"}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map(property => (
              <article
                key={property._id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  to={`/properties/${property._id}`}
                  className="block"
                >
                  <div
                    className="h-52 bg-gray-100 bg-cover bg-center"
                    style={{
                      backgroundImage: property.images?.[0]
                        ? `url("${property.images[0]}")`
                        : property.image
                          ? `url("${property.image}")`
                          : undefined
                    }}
                  >
                    {!property.images?.[0] && !property.image && (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        Property image unavailable
                      </div>
                    )}
                  </div>
                </Link>

                <div className="space-y-4 p-5">
                  <div>
                    <h2 className="line-clamp-2 text-lg font-bold text-gray-900">
                      {property.title || "Untitled property"}
                    </h2>

                    <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={15} className="shrink-0 text-green-700" />
                      {[property.city, property.state]
                        .filter(Boolean)
                        .join(", ") || "Location not specified"}
                    </p>
                  </div>

                  {property.price != null && (
                    <p className="text-xl font-bold text-green-800">
                      ₦{Number(property.price).toLocaleString("en-NG")}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <Link
                      to={`/properties/${property._id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-900"
                    >
                      View property
                      <ArrowUpRight size={16} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(property._id)}
                      disabled={removingId === property._id}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      {removingId === property._id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
