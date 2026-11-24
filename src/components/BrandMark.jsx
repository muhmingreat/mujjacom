import { motion } from "framer-motion";

export default function BrandMark({ compact = false }) {
  return (
    <div className="brand-mark" aria-label="Amanah Estates">
      <motion.svg
        viewBox="0 0 64 42"
        className="brand-symbol"
        aria-hidden="true"
        animate={{ rotate: [0, 2, -2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M4 22C12 5 23 5 32 21C41 37 52 37 60 20" />
        <path d="M4 20C12 37 23 37 32 21C41 5 52 5 60 22" />
      </motion.svg>
      {!compact && (
        <span className="brand-wordmark">
          <strong>AMANAH</strong>
          <small>ESTATES</small>
        </span>
      )}
    </div>
  );
}
