// Public endpoint: returns the latest known location for a case + status.
// Used by the live tracking page that emergency contacts open from their SMS link.
// No auth required — link is unguessable (case ID), and only returns minimal data.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let caseId = url.searchParams.get("case_id");
    if (!caseId) {
      try {
        const body = await req.json();
        caseId = body?.case_id;
      } catch {}
    }
    if (!caseId) return Response.json({ error: "Missing case_id" }, { status: 400 });

    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId }, "-created_date", 1);
    const c = cases[0];
    if (!c) return Response.json({ error: "Not found" }, { status: 404 });

    // Return only location + status + ref. No PII.
    return Response.json({
      case_ref: c.case_id,
      status: c.status,
      lat: c.location_lat,
      lng: c.location_lng,
      updated_at: c.updated_date,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});