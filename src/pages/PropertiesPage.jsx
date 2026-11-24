
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, ArrowUpRight } from "lucide-react";
import { api } from "../services/api.js";
import SavePropertyButton from "../components/SavePropertyButton.jsx";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    api.getProperties()
      .then(data => {
        if (active) {
          setProperties(data.data || []);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("offline");
      });

    return () => {
      active = false;
    };
  }, []);

  const visible = properties.filter(item => {
    const haystack = `${item.title || ""} ${item.location?.city || ""} ${item.location?.state || ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <section className="page-section shell">
      <span className="eyebrow dark">AMANAH MARKETPLACE</span>

      <div className="page-title-row">
        <div>
          <h1>Explore properties</h1>
          <p>Browse opportunities and review the details that matter.</p>
        </div>
      </div>

      <label className="search-box">
        <Search size={19} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by property or location"
        />
      </label>

      {status === "loading" && (
        <p className="notice">Loading property inventory...</p>
      )}

      {status === "offline" && (
        <div className="notice notice-warn">
          The property service is not connected yet. Start the backend and connect MongoDB to load live listings.
        </div>
      )}

      {status === "ready" && visible.length === 0 && (
        <div className="empty-state">
          No matching properties are available yet.
        </div>
      )}

      {status === "ready" && (
        <div className="property-grid">
          {visible.map(item => (
            <article className="property-card" key={item._id}>
              <div
                className="property-image"
                style={{
                  backgroundImage: item.coverImage
                    ? `url(${item.coverImage})`
                    : "linear-gradient(135deg,#d8d2c2,#9eaa9d)"
                }}
              >
                <span>{item.transactionType || "Property"}</span>
              </div>

              <div className="property-card-body">
                <small>
                  <MapPin size={13} />
                  {item.location?.city || "Location pending"},{" "}
                  {item.location?.state || "Nigeria"}
                </small>

                <h3>{item.title}</h3>

                <strong>
                  {item.price
                    ? `₦${Number(item.price).toLocaleString("en-NG")}`
                    : "Price on request"}
                </strong>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/properties/${item._id}`}
                    className="inline-flex items-center gap-1"
                  >
                    View details
                    <ArrowUpRight size={15} />
                  </Link>

                  <SavePropertyButton propertyId={item._id} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
