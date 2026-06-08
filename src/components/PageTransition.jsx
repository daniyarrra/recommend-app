import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/*
  Pure crossfade — no Y movement.
  Element-level CSS animations inside pages handle the rest.
  This avoids double-animation stacking that caused the "jump from bottom" effect.
*/

const PageTransition = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.25,
        ease: "easeInOut",
      }}
      style={{
        willChange: "opacity",
        transform: "translateZ(0)",
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
