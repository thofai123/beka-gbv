// Offline-safe emergency event queue.
// Persists in IndexedDB and auto-retries on reconnect.

import { apiClient } from "@/api/client";

const DB_NAME = "safeguard_emergency";
const DB_VERSION = 1;
const STORE = "panicQueue";
export const SELECTED_CONTACTS_KEY = "beka_selected_alert_contacts";

export function getSelectedContactIds(allContacts = []) {
  try {
    const raw = localStorage.getItem(SELECTED_CONTACTS_KEY);
    if (raw === null) {
      // Default: all contacts selected until user customizes
      return allContacts.map((c) => c.id);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return allContacts.map((c) => c.id);
    const validSet = new Set(allContacts.map((c) => c.id));
    return parsed.filter((id) => validSet.has(id));
  } catch {
    return allContacts.map((c) => c.id);
  }
}

export function setSelectedContactIds(ids) {
  try {
    localStorage.setItem(SELECTED_CONTACTS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function uuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(event) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(event);
  return new Promise((res) => { tx.oncomplete = res; });
}

async function listQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).getAll();
  return new Promise((res) => { req.onsuccess = () => res(req.result || []); });
}

async function removeFromQueue(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  return new Promise((res) => { tx.oncomplete = res; });
}

export async function submitPanic({
  location_lat,
  location_lng,
  location_captured_at,
  is_silent,
  selected_contact_ids,
}) {
  let chosenIds = selected_contact_ids;
  if (!Array.isArray(chosenIds)) {
    try {
      const raw = localStorage.getItem(SELECTED_CONTACTS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) chosenIds = parsed;
      }
    } catch {
      /* ignore */
    }
  }

  const event = {
    id: uuid(),
    client_idempotency_key: uuid(),
    location_lat: location_lat ?? null,
    location_lng: location_lng ?? null,
    location_captured_at: location_captured_at || null,
    is_silent: !!is_silent,
    selected_contact_ids: Array.isArray(chosenIds) ? chosenIds : null,
    queued_at: new Date().toISOString(),
    attempts: 0,
  };

  if (!navigator.onLine) {
    await enqueue(event);
    return { queued: true, id: event.id };
  }

  try {
    const res = await apiClient.functions.invoke("triggerEmergency", {
      location_lat: event.location_lat,
      location_lng: event.location_lng,
      location_captured_at: event.location_captured_at,
      is_silent: event.is_silent,
      client_idempotency_key: event.client_idempotency_key,
      selected_contact_ids: event.selected_contact_ids,
    });
    return { sent: true, response: res.data };
  } catch (err) {
    await enqueue({ ...event, last_error: err.message });
    return { queued: true, id: event.id, error: err.message };
  }
}

const MAX_ATTEMPTS = 5;

export async function drainQueue() {
  if (!navigator.onLine) return { drained: 0, remaining: 0 };

  const authed = await apiClient.auth.isAuthenticated().catch(() => false);
  if (!authed) return { drained: 0, remaining: (await listQueue()).length };

  const queue = await listQueue();
  let drained = 0;
  for (const event of queue) {
    try {
      await apiClient.functions.invoke("triggerEmergency", {
        location_lat: event.location_lat,
        location_lng: event.location_lng,
        is_silent: event.is_silent,
        client_idempotency_key: event.client_idempotency_key,
        selected_contact_ids: event.selected_contact_ids ?? null,
      });
      await removeFromQueue(event.id);
      drained++;
    } catch {
      const attempts = (event.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await removeFromQueue(event.id);
      } else {
        await enqueue({ ...event, attempts });
      }
    }
  }
  const remaining = (await listQueue()).length;
  return { drained, remaining };
}

export async function pendingCount() {
  return (await listQueue()).length;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { drainQueue(); });
  setTimeout(() => { drainQueue(); }, 2000);
}
