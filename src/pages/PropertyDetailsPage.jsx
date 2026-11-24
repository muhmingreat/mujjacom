import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ArrowLeft,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import SavePropertyButton from "../components/SavePropertyButton.jsx";

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuth();

  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationError, setApplicationError] = useState("");
  const [applicationSuccess, setApplicationSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .getProperty(id)
      .then((data) => {
        if (active) setProperty(data.data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const applicationType = {
    sale: "purchase",
    rent: "rent",
    lease: "lease",
  }[property?.transactionType];

  const isPropertyOwner =
    Boolean(user?._id) &&
    String(user._id) === String(property?.owner?._id || property?.owner);

    const priceFrequencyLabels = {
  one_time: "One-time payment",
  monthly: "Per month",
  quarterly: "Every 3 months",
  biannually: "Every 6 months",
  annually: "Per year",
};

const priceFrequencyLabel =
  priceFrequencyLabels[property?.priceFrequency] || "";

  async function handleApplicationSubmit(event) {
    event.preventDefault();

    setApplicationError("");
    setApplicationSuccess("");

    if (!isAuthenticated || !token) {
      setApplicationError("Please sign in before submitting an application.");
      return;
    }

    if (!user?.isEmailVerified) {
      setApplicationError(
        "Please verify your email address before submitting an application.",
      );
      return;
    }

    if (!applicationType) {
      setApplicationError("This property's application type is unavailable.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.createApplication(
        property._id,
        {
          applicationType,
          message: applicationMessage,
        },
        token,
      );

      setApplicationSuccess(
        response.message || "Your application was submitted successfully.",
      );

      setApplicationMessage("");
    } catch (err) {
      setApplicationError(err.message || "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <section className="page-section shell">
        <p className="notice notice-warn">{error}</p>
        <Link to="/properties">Back to properties</Link>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="page-section shell">
        <p>Loading property...</p>
      </section>
    );
  }

  return (
    <section className="page-section shell">
      <Link className="back-link" to="/properties">
        <ArrowLeft size={16} />
        Back to marketplace
      </Link>

      <div
        className="detail-hero"
        style={{
          backgroundImage: property.coverImage
            ? `url(${property.coverImage})`
            : "linear-gradient(135deg,#d8d2c2,#9eaa9d)",
        }}
      />

      <span className="eyebrow dark">
        {property.transactionType || "PROPERTY"}
      </span>

      <h1>{property.title}</h1>

      <p>
        <MapPin size={16} />
        {property.location?.city}, {property.location?.state}
      </p>

      {/* <h2>
        {property.price
          ? `₦${Number(property.price).toLocaleString("en-NG")}`
          : "Price on request"}
      </h2> */}
      <div className="mt-4">
  <h2 className="text-3xl font-bold text-green-700">
    {property.price
      ? `₦${Number(property.price).toLocaleString("en-NG")}`
      : "Price on request"}
  </h2>

  {priceFrequencyLabel && (
    <p className="mt-1 text-sm font-medium text-gray-600">
      {priceFrequencyLabel}
    </p>
  )}
</div>

      <p className="detail-description">
        {property.description ||
          "Further property information will be provided by the Amanah Estates team."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link className="button button-green" to="/dashboard">
          Make an enquiry
        </Link>

        <SavePropertyButton propertyId={property._id} />
      </div>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Apply for this property</h2>

        <p className="mt-2 text-gray-600">
          Submit your interest in this property. The property representative can
          review your application and respond.
        </p>

        {isPropertyOwner ? (
          <div className="mt-5 rounded-xl bg-blue-50 p-4 text-blue-800">
            <AlertCircle className="mb-2" size={20} />
            <p>
              You are the owner of this property. You cannot submit an
              application for your own listing.
            </p>
          </div>
        ) : !isAuthenticated ? (
          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-gray-700">
              Please sign in to submit an application.
            </p>

            <Link to="/login" className="button button-green mt-4 inline-flex">
              Sign in to continue
            </Link>
          </div>
        ) : !user?.isEmailVerified ? (
          <div className="mt-5 rounded-xl bg-yellow-50 p-4 text-yellow-800">
            <AlertCircle className="mb-2" size={20} />
            <p>Your email address must be verified before you can apply.</p>
            <Link
              to="/verify-email"
              className="mt-3 inline-block font-semibold underline"
            >
              Verify your email
            </Link>
          </div>
        ) : !applicationType ? (
          <p className="mt-5 text-red-600">
            Applications are not available for this property type.
          </p>
        ) : (
          <form onSubmit={handleApplicationSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block font-medium">Application type</label>

              <input
                type="text"
                value={
                  applicationType === "purchase"
                    ? "Purchase"
                    : applicationType === "rent"
                      ? "Rent"
                      : "Lease"
                }
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Message to the property representative
              </label>

              <textarea
                value={applicationMessage}
                onChange={(event) => setApplicationMessage(event.target.value)}
                rows={5}
                maxLength={3000}
                placeholder="Introduce yourself and explain your interest in this property..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-1 text-right text-sm text-gray-500">
                {applicationMessage.length}/3000
              </p>
            </div>

            {applicationError && (
              <div className="flex gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                <AlertCircle size={20} className="shrink-0" />
                <p>{applicationError}</p>
              </div>
            )}

            {applicationSuccess && (
              <div className="flex gap-2 rounded-xl bg-green-50 p-4 text-green-700">
                <CheckCircle2 size={20} className="shrink-0" />
                <p>{applicationSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || Boolean(applicationSuccess)}
              className="button button-green inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit application
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
