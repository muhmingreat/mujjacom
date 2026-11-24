
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ArrowUpRight, LogOut, UserCircle } from "lucide-react";
import BrandMark from "./BrandMark.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  ["Properties", "/properties"],
  ["Estates", "/estates"],
  ["Sell with us", "/sell-property"],
  ["AI assistant", "/ai"],
  ["About", "/about"]
];

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <BrandMark />
          </Link>

          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
            {navItems.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}

            {!loading && (
              isAuthenticated ? (
                <>
                  <Link
                    className="nav-account"
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserCircle size={17} />
                    {user?.firstName || "My account"}
                    <ArrowUpRight size={15} />
                  </Link>

                  <button
                    type="button"
                    className="nav-account"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="nav-account"
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>

                  <Link
                    className="nav-account"
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                  >
                    Register
                    <ArrowUpRight size={15} />
                  </Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div>
            <BrandMark />
            <p className="footer-copy">
              Thoughtful property opportunities, clear processes and
              service built around trust.
            </p>
          </div>

          <div className="footer-links">
            <strong>Explore</strong>
            <Link to="/properties">Browse properties</Link>
            <Link to="/sell-property">Sell your property</Link>
            <Link to="/ai">Amanah AI</Link>
          </div>

          <div className="footer-links">
            <strong>Get in touch</strong>
            <a href="mailto:hello@amanahestates.example">
              hello@amanahestates.example
            </a>
            <span>Contact details will be configured before launch.</span>
          </div>
        </div>

        <div className="shell footer-bottom">
          © {new Date().getFullYear()} AMANAH ESTATES. All rights reserved.
        </div>
      </footer>
    </>
  );
}
