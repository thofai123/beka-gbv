// Option A: Automatic background SMS delivery via SMSala / Africala.
// Required Render Environment Variables:
//   AFRICALA_API_TOKEN=<your_smsala_api_token>
//   SMS_SENDER_ID=BEKA (or your approved sender ID)

const AFRICALA_ENDPOINT = "https://api2.smsala.com/SendSmsV2";
const SENDER_ID = process.env.SMS_SENDER_ID || "BEKA";

export function normalizeZambianPhone(phoneNumber) {
  let phone = String(phoneNumber || "").replace(/[\s()-]/g, "");
  if (/^0[79]\d{8}$/.test(phone)) phone = "+260" + phone.slice(1);
  if (/^260[79]\d{8}$/.test(phone)) phone = "+" + phone;
  if (!/^\+260[79]\d{8}$/.test(phone)) {
    throw new Error("Phone number must be in +2609XXXXXXXX or +2607XXXXXXXX format");
  }
  return phone;
}

export function stripPlus(phone) {
  let cleaned = String(phone || "").replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (/^0[79]\d{8}$/.test(cleaned)) cleaned = "260" + cleaned.slice(1);
  return cleaned;
}

export function buildMapsLink(lat, lng) {
  if (lat != null && lng != null) return `https://maps.google.com/?q=${lat},${lng}`;
  return null;
}

export async function sendSms(destination, message, messageType = 1) {
  const apiToken = process.env.AFRICALA_API_TOKEN;
  const destinationAddress = stripPlus(destination);

  if (!apiToken) {
    console.warn(`[sms] AFRICALA_API_TOKEN not set — skipping SMS to ${destinationAddress}`);
    return { ok: false, skipped: true, status: 0, body: "AFRICALA_API_TOKEN not configured" };
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
    const lowered = body.toLowerCase();
    const failedInPayload =
      lowered.includes("invalid") ||
      lowered.includes("error") ||
      lowered.includes("insufficient") ||
      lowered.includes("failed");

    const ok = response.ok && !failedInPayload;
    if (!ok) {
      console.error(`[sms] SMSala delivery issue (${response.status}) to ${destinationAddress}: ${body.slice(0, 200)}`);
    }
    return { ok, provider: "africala", status: response.status, body: body.slice(0, 500) };
  } catch (err) {
    return { ok: false, provider: "africala", status: 0, body: String(err).slice(0, 500) };
  }
}
