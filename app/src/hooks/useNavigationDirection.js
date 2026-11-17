import { useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Tracks navigation direction for iOS-style push/pop transitions.
 * Returns 1 for a forward "push" (slide-from-right) and -1 for a
 * backward "pop" (slide-to-left), based on history depth.
 *
 * iOS treats the root tab routes as siblings — switching between them
 * should not feel like a deep push. Depth is derived from the path so
 * lateral tab switches resolve to a gentle forward motion.
 */

function depthOf(pathname) {
  // "/beka/" -> 1, "/beka/cases" -> 2, "/beka/cases/123" -> 3
  return pathname.replace(/\/+$/, "").split("/").filter(Boolean).length;
}

export function useNavigationDirection() {
  const location = useLocation();
  const prev = useRef({ key: location.key, depth: depthOf(location.pathname) });

  const currentDepth = depthOf(location.pathname);
  let direction = 1;

  if (location.key !== prev.current.key) {
    if (currentDepth < prev.current.depth) direction = -1; // going shallower => pop
    else direction = 1; // deeper or lateral => push
    prev.current = { key: location.key, depth: currentDepth };
  } else {
    direction = currentDepth < prev.current.depth ? -1 : 1;
  }

  return direction;
}