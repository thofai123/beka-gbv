import crypto from "node:crypto";

// 6-digit code from a cryptographically secure source.
export function randomCode() {
  return String(crypto.randomInt(100000, 1000000));
}

// In-memory counters. pm2 runs one backend process, so this is enough.
// Counters reset when the backend restarts.
const buckets = new Map();
const failures = new Map();

// Allow at most `max` calls per `windowMs` for `key`.
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= max) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Wrong-guess tracking: locked once `max` failures happen inside the window.
export function isLocked(key, max) {
  const f = failures.get(key);
  if (!f || f.reset <= Date.now()) return { locked: false, retryAfter: 0 };
  if (f.count >= max) {
    return { locked: true, retryAfter: Math.ceil((f.reset - Date.now()) / 1000) };
  }
  return { locked: false, retryAfter: 0 };
}

export function recordFailure(key, windowMs) {
  const now = Date.now();
  const f = failures.get(key);
  if (!f || f.reset <= now) {
    failures.set(key, { count: 1, reset: now + windowMs });
  } else {
    f.count += 1;
  }
}

export function clearFailures(key) {
  failures.delete(key);
}

// Drop expired entries so the maps cannot grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  for (const [k, v] of failures) if (v.reset <= now) failures.delete(k);
}, 10 * 60 * 1000).unref();
