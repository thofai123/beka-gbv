import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let payload = {};
    try {
      payload = await req.json();
    } catch {
      return Response.json({ success: false, reason: "invalid_body" }, { status: 400 });
    }

    const code = String(payload.code || "").trim().toUpperCase();
    if (!code) {
      return Response.json({ success: false, reason: "missing_code" }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.AccessCode.filter(
      { code, is_active: true },
      "-created_date",
      1
    );

    const accessCode = matches[0];
    if (!accessCode) {
      return Response.json({ success: false, reason: "invalid" });
    }

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ success: false, reason: "unauthorized" }, { status: 401 });
    }

    if (!user) {
      return Response.json({ success: false, reason: "unauthorized" }, { status: 401 });
    }

    await base44.auth.updateMe({ role: accessCode.role });

    return Response.json({ success: true, role: accessCode.role });
  } catch (error) {
    console.error("redeemAccessCode error:", error.message);
    return Response.json(
      { success: false, reason: "server_error", error: error.message },
      { status: 500 }
    );
  }
});