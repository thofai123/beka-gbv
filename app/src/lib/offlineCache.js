const DB_NAME = "safeguard_zambia";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("cases")) db.createObjectStore("cases", { keyPath: "id" });
      if (!db.objectStoreNames.contains("caseUpdates")) db.createObjectStore("caseUpdates", { keyPath: "id" });
      if (!db.objectStoreNames.contains("pendingNotes")) db.createObjectStore("pendingNotes", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheAll(store, items) {
  const db = await openDB();
  const tx = db.transaction(store, "readwrite");
  const s = tx.objectStore(store);
  items.forEach((item) => s.put(item));
  return new Promise((res) => { tx.oncomplete = res; });
}

export async function getAll(store) {
  const db = await openDB();
  const tx = db.transaction(store, "readonly");
  const s = tx.objectStore(store);
  const req = s.getAll();
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

export async function queuePendingNote(note) {
  const db = await openDB();
  const tx = db.transaction("pendingNotes", "readwrite");
  tx.objectStore("pendingNotes").add({ ...note, queued_at: new Date().toISOString() });
  return new Promise((res) => { tx.oncomplete = res; });
}

export async function getPendingNotes() {
  return getAll("pendingNotes");
}

export async function clearPendingNote(id) {
  const db = await openDB();
  const tx = db.transaction("pendingNotes", "readwrite");
  tx.objectStore("pendingNotes").delete(id);
  return new Promise((res) => { tx.oncomplete = res; });
}