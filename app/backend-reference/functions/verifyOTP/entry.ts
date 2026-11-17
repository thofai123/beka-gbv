import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

function normalizePhone(phoneNumber) {
  const phone = String(phoneNumber || "").replace(/\s+/g, "").replace(/-/g, "");
  if (!/^\+2609\d{8}$/.test(phone)) {
    throw new Error("Phone number must be in +2609XXXXXXXX format");
  }
  return phone;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { phoneNumber, otp } = await req.json();
    const phone = normalizePhone(phoneNumber);
    const cleanOtp = String(otp || "").trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return Response.json({ error: "Enter the 6-digit verification code" }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities.OtpVerification.filter(
      { phone, otp: cleanOtp, verified: false },
      "-created_date",
      1
    );
    const record = records[0];

    if (!record) return Response.json({ error: "Invalid verification code" }, { status: 400 });

    if (new Date(record.expires_at) < new Date()) {
      return Response.json({ error: "Verification code expired. Please resend code." }, { status: 400 });
    }

    await base44.asServiceRole.entities.OtpVerification.update(record.id, { verified: true });
    return Response.json({ success: true });
  } catch (error) {
    console.error("verifyOTP error:", error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});