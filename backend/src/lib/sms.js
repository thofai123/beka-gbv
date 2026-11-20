// SMS delivery via Africala / SMSala (ported from the original functions).
// If AFRICALA_API_TOKEN is not set, sends are logged and skipped so the app
// works in development without live credentials.

const AFRICALA_ENDPOINT = "https://api2.smsala.com/SendSmsV2";
const SENDER_ID = process.env.SMS_SENDER_ID || "AlaTech";

export function normalizeZambianPhone(phoneNumber) {
  const phone = String(phoneNumber || "").replace(/\s+/g, "").replace(/-/g, "");
  if (!/^\+2609\d{8}$/.test(phone)) {
    throw new Error("Phone number must be in +2609XXXXXXXX format");
  }
  return phone;
}

export function stripPlus(phone) {
  let cleaned = String(phone || "").replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (/^0[79]\d{8}$/.test(cleaned)) cleaned = "260" + cleaned.slice(1);
  return cleaned;
}

export function buildMapsLink(lat, lng) {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return null;
}

export async function sendSms(destination, message, messageType = 1) {
  const apiToken = process.env.AFRICALA_API_TOKEN;
  const destinationAddress = stripPlus(destination);

  if (!apiToken) {
    console.warn(`[sms] AFRICALA_API_TOKEN not set — skipping SMS to ${destinationAddress}: "${message.slice(0, 60)}..."`);
    return { ok: false, skipped: true, status: 0, body: "no api token" };
  }

  const url =
    `${AFRICALA_ENDPOINT}?apiToken=${encodeURIComponent(apiToken)}` +
    `&messageType=${encodeURIComponent(String(messageType))}` +
    `&messageEncoding=1` +
    `&destinationAddress=${encodeURIComponent(destinationAddress)}` +
    `&sourceAddress=${encodeURIComponent(SENDER_ID)}` +
    `&messageText=${encodeURIComponent(message)}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body: body.slice(0, 500) };
  } catch (err) {
    return { ok: false, status: 0, body: String(err).slice(0, 500) };
  }
}
