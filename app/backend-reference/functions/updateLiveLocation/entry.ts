// Updates the survivor's live location on an active case.
// Called from the panic screen every ~10s while the survivor is moving.
// Only the case creator can update; only updates if case is still active.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { case_id, lat, lng } = await req.json();
    if (!case_id || typeof lat !== "number" || typeof lng !== "number") {
      return Response.json({ error: "Missing case_id, lat, or lng" }, { status: 400 });
    }

    const cases = await base44.asServiceRole.entities.Case.filter({ id: case_id }, "-created_date", 1);
    const c = cases[0];
    if (!c) return Response.json({ error: "Case not found" }, { status: 404 });

    // Only the survivor (creator) can push their own live location
    if (c.created_by !== user.email) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only update if case is still active
    const ACTIVE = ["received", "dispatched", "acknowledged", "in_progress", "escalated"];
    if (!ACTIVE.includes(c.status)) {
      return Response.json({ success: false, reason: "case_not_active" });
    }

    await base44.asServiceRole.entities.Case.update(case_id, {
      location_lat: lat,
      location_lng: lng,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("updateLiveLocation error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});