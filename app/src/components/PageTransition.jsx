import { motion } from "framer-motion";

/**
 * iOS-style screen transition.
 *  - Push (direction = 1):  new screen slides in from the right.
 *  - Pop  (direction = -1): new screen slides in from the left.
 *
 * Uses transform/opacity only (GPU-composited) and a tuned spring so it
 * stays at 60fps on iOS without layout thrash. Honors prefers-reduced-motion
 * by collapsing to a quick fade.
 */
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const spring = { type: "spring", stiffness: 360, damping: 34, mass: 0.9 };

export default function PageTransition({ children, direction = 1 }) {
  if (prefersReducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {children}
      </motion.div>
    );
  }

  const offset = 28 * direction;

  return (
    <motion.div
      initial={{ opacity: 0, x: offset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -offset * 0.6 }}
      transition={spring}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}