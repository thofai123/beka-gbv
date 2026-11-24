import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const configuredJwtSecret = process.env.JWT_SECRET;
if (
  process.env.NODE_ENV === "production" &&
  (!configuredJwtSecret ||
    configuredJwtSecret.length < 32 ||
    configuredJwtSecret === "dev-insecure-secret-change-me")
) {
  throw new Error("JWT_SECRET must be set to at least 32 characters in production");
}
const JWT_SECRET = configuredJwtSecret || "dev-insecure-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Express middleware: attaches req.user if a valid Bearer token is present.
 * Does NOT reject unauthenticated requests — use requireAuth for that.
 */
export function attachUser(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // invalid/expired token -> treated as anonymous
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  next();
}

/**
 * Restrict a route to specific roles.
 *   router.get("/x", requireAuth, requireRole("admin"), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
