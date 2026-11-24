import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, MapPin, Sparkles, House, Trees } from "lucide-react";

const categories = [
  { icon: Trees, title: "Buy land", text: "Explore land opportunities and estate developments." },
  { icon: House, title: "Buy a home", text: "Find a home that fits your plans and priorities." },
  { icon: MapPin, title: "Lease or rent", text: "Discover flexible property options." }
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-image" />
        <div className="shell hero-content">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
            <span className="eyebrow"><span /> PROPERTY WITH CONFIDENCE</span>
            <h1>Find a place to grow.<br /><em>Build with purpose.</em></h1>
            <p>Explore land, homes, leases and rental opportunities through a property experience designed around clarity and trust.</p>
            <div className="hero-actions">
              <Link className="button button-gold" to="/properties">Explore properties <ArrowUpRight size={17} /></Link>
              <Link className="button button-glass" to="/sell-property">Sell with Amanah</Link>
            </div>
          </motion.div>
          <div className="hero-note"><ShieldCheck size={18} /> Clear information. Human review. A more considered property journey.</div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div><span className="eyebrow dark">DISCOVER YOUR OPTIONS</span><h2>Property journeys,<br /><em>made clearer.</em></h2></div>
          <Link className="text-link" to="/properties">View marketplace <ArrowUpRight size={16} /></Link>
        </div>
        <div className="category-grid">
          {categories.map(({ icon: Icon, title, text }, index) => (
            <motion.div className="category-card" key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }}>
              <span className="category-icon"><Icon size={22} /></span>
              <h3>{title}</h3><p>{text}</p>
              <Link to="/properties" aria-label={`Explore ${title}`}><ArrowUpRight size={18} /></Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="trust-band">
        <div className="shell trust-inner">
          <div><span className="eyebrow">THE AMANAH APPROACH</span><h2>Trust is built into<br /><em>every step.</em></h2></div>
          <div className="trust-points">
            <p><ShieldCheck /> Property information reviewed by people, not just algorithms.</p>
            <p><Sparkles /> Helpful digital tools that make the process easier to understand.</p>
            <p><MapPin /> Clear location, payment and application information.</p>
          </div>
        </div>
      </section>

      <section className="section shell final-cta">
        <span className="eyebrow dark">READY WHEN YOU ARE</span>
        <h2>Your next property decision<br /><em>starts with a conversation.</em></h2>
        <Link className="button button-green" to="/ai">Talk to Amanah AI <ArrowUpRight size={17} /></Link>
      </section>
    </>
  );
}
