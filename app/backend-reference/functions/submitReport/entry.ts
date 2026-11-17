import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // SAFE AUTH — reporting must never be blocked by an auth hiccup.
    // We try to identify the user, but if the session can't be resolved we
    // still allow the report to be submitted (it may be anonymous).
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (err) {
      console.log("Auth not resolved, continuing as anonymous:", err.message);
    }

    // SAFE BODY READ (NO STREAM CRASH)
    const clonedReq = req.clone();

    let parsedBody = {};
    try {
      const rawText = await clonedReq.text();
      parsedBody = rawText ? JSON.parse(rawText) : {};
    } catch (err) {
      console.log("Body parse error:", err.message);
      return Response.json(
        { error: "Invalid request body", details: err.message },
        { status: 400 }
      );
    }

    // SAFE FIELD EXTRACTION
    const {
      incident_type,
      description,
      risk_level,
      ai_summary,
      is_anonymous,
      reporter_email,
      reporter_user_id,
      survivor_name,
      survivor_contact,
      location_lat,
      location_lng,
      location_captured_at,
      location_description,
      attachments,
      channel
    } = parsedBody || {};

    // VALIDATION
    if (!incident_type || !description) {
      return Response.json(
        { error: "Missing required fields: incident_type or description" },
        { status: 400 }
      );
    }

    // SAFE ATTACHMENTS HANDLING
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    // Generate a human-readable case reference
    const caseRef = `GBV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log("Creating case:", {
      caseRef,
      incident_type,
      risk_level,
      is_anonymous,
      attachmentCount: safeAttachments.length
    });

    // DATABASE INSERT — uses the Base44 Case entity (service role so the
    // write succeeds even when the user session isn't fully resolved).
    const newCase = await base44.asServiceRole.entities.Case.create({
      case_id: caseRef,
      incident_type,
      description,
      status: "received",
      risk_level: risk_level || "medium",
      ai_summary: ai_summary || "",
      is_anonymous: !!is_anonymous,
      reporter_email: user?.email || reporter_email || "",
      reporter_user_id: user?.id || reporter_user_id || "",
      survivor_name: is_anonymous ? "" : (survivor_name || ""),
      survivor_contact: is_anonymous ? "" : (survivor_contact || ""),
      location_lat: typeof location_lat === "number" ? location_lat : undefined,
      location_lng: typeof location_lng === "number" ? location_lng : undefined,
      location_captured_at: location_captured_at || "",
      location_description: location_description || "",
      attachments: safeAttachments,
      report_source: "report",
      channel: channel || "app"
    });

    return Response.json({
      success: true,
      message: "Report submitted successfully",
      case_id: newCase.id,
      case_ref: caseRef
    });

  } catch (error) {
    console.error("submitReport ERROR:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message
      },
      { status: 500 }
    );
  }
});