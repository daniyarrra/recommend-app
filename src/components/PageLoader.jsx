import { motion } from "framer-motion";
import "../styles/main.css";

const loaderVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
};

const PageLoader = () => (
  <motion.div
    variants={loaderVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      flexDirection: "column",
      gap: "20px",
    }}
  >
    {/* Animated gradient ring spinner */}
    <div className="page-loader-ring">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <defs>
          <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
        />
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="url(#loaderGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80 45"
          style={{ animation: "spin 0.9s linear infinite" }}
        />
      </svg>
    </div>
    <span
      style={{
        fontSize: "0.9rem",
        fontWeight: 500,
        color: "var(--text-secondary)",
        letterSpacing: "0.02em",
      }}
    >
      Загрузка...
    </span>
  </motion.div>
);

export default PageLoader;
