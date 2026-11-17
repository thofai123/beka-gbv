/**
 * Haptic feedback utility — uses the Vibration API where available.
 * Silent no-op on unsupported devices (desktop, iOS Safari).
 */
const can = () => typeof navigator !== "undefined" && "vibrate" in navigator;

export const haptic = {
  light: () => can() && navigator.vibrate(8),
  medium: () => can() && navigator.vibrate(15),
  heavy: () => can() && navigator.vibrate(30),
  success: () => can() && navigator.vibrate([10, 40, 10]),
  warning: () => can() && navigator.vibrate([20, 60, 20]),
  error: () => can() && navigator.vibrate([40, 80, 40, 80]),
  // For panic — unmistakable
  panic: () => can() && navigator.vibrate([60, 30, 60, 30, 60]),
};