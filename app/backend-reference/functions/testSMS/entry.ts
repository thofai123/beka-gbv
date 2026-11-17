import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const apiToken = Deno.env.get("AFRICALA_API_TOKEN");
    if (!apiToken) return Response.json({ error: "AFRICALA_API_TOKEN is not configured" }, { status: 500 });

    const { phone } = await req.json();
    if (!phone) return Response.json({ error: "phone is required" }, { status: 400 });

    const destination = String(phone).replace(/\s+/g, "").replace(/^\+/, "");
    const messageText = "Test message from BEKA app";

    const url = `https://api2.smsala.com/SendSmsV2?apiToken=${encodeURIComponent(apiToken)}&messageType=2&messageEncoding=1&destinationAddress=${encodeURIComponent(destination)}&sourceAddress=BEKA&messageText=${encodeURIComponent(messageText)}`;

    const response = await fetch(url, { method: "GET" });
    const body = await response.text();

    return Response.json({
      success: response.ok,
      status: response.status,
      body,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});