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

async function sendAfricalaSms(destinationAddress, message, messageType) {
  const apiToken = Deno.env.get("AFRICALA_API_TOKEN");
  if (!apiToken) throw new Error("AFRICALA_API_TOKEN is not configured");

  const url = `${AFRICALA_ENDPOINT}?apiToken=${encodeURIComponent(apiToken)}&messageType=${encodeURIComponent(String(messageType))}&messageEncoding=1&destinationAddress=${encodeURIComponent(destinationAddress)}&sourceAddress=${encodeURIComponent(SENDER_ID)}&messageText=${encodeURIComponent(message)}`;
  const response = await fetch(url, { method: "GET" });
  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body: text.slice(0, 500),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { survivorName, location, trustedContacts } = await req.json();
    if (!Array.isArray(trustedContacts) || trustedContacts.length === 0) {
      return Response.json({ error: "trustedContacts must be a non-empty array" }, { status: 400 });
    }

    const name = survivorName || "A BEKA user";
    const locationText = location || "Location unavailable";
    const message = `EMERGENCY ALERT: ${name} needs urgent help. Location: ${locationText}. This alert was sent via the BEKA Emergency App.`;
    const uniqueContacts = [...new Set(trustedContacts.map(normalizePhone))];
    const destinationAddress = uniqueContacts.map((phone) => phone.replace(/^\+/, "")).join(",");
    const result = await sendAfricalaSms(destinationAddress, message, 2);

    return Response.json({
      success: result.ok,
      destinationAddress,
      status: result.status,
      response: result.body,
    });
  } catch (error) {
    console.error("sendAlertSMS error:", error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});