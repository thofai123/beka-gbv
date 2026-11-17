import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const AFRICALA_ENDPOINT = "https://api2.smsala.com/SendSmsV2";
const SENDER_ID = "AlaTech";

function normalizePhone(phoneNumber) {
  const phone = String(phoneNumber || "").replace(/\s+/g, "").replace(/-/g, "");
  if (!/^\+2609\d{8}$/.test(phone)) {
    throw new Error("Phone number must be in +2609XXXXXXXX format");
  }
  return phone;
}

async function sendAfricalaSms(phone, message, messageType) {
  const apiToken = Deno.env.get("AFRICALA_API_TOKEN");
  if (!apiToken) throw new Error("AFRICALA_API_TOKEN is not configured");

  const destinationAddress = phone.replace(/^\+/, "");
  const url = `${AFRICALA_ENDPOINT}?apiToken=${encodeURIComponent(apiToken)}&messageType=${encodeURIComponent(String(messageType))}&messageEncoding=1&destinationAddress=${encodeURIComponent(destinationAddress)}&sourceAddress=${encodeURIComponent(SENDER_ID)}&messageText=${encodeURIComponent(message)}`;
  const response = await fetch(url, { method: "GET" });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Africala SMS failed with status ${response.status}: ${text.slice(0, 200)}`);
  }

  return { status: response.status, body: text.slice(0, 500) };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { phoneNumber } = await req.json();
    const phone = normalizePhone(phoneNumber);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const existing = await base44.asServiceRole.entities.OtpVerification.filter({ phone, verified: false });
    for (const item of existing) {
      await base44.asServiceRole.entities.OtpVerification.update(item.id, { verified: true });
    }

    await base44.asServiceRole.entities.OtpVerification.create({
      phone,
      otp,
      expires_at: expiresAt,
      verified: false,
    });

    const message = `Your BEKA verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    await sendAfricalaSms(phone, message, 3);

    return Response.json({ success: true });
  } catch (error) {
    console.error("sendOTP error:", error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});