/**
 * Quick exit — used in trauma-informed apps so a survivor can leave instantly
 * if someone walks in. Replaces history & redirects to a neutral site.
 */
export function quickExit() {
  try {
    // Wipe local cache so app doesn't auto-restore on reopen
    sessionStorage.clear();
  } catch {}
  // Replace current page so back button can't return
  window.location.replace("https://www.google.com/search?q=weather");
}