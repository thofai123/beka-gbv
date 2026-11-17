// Generates a PDF formatted as a Zambian ZP Form 32 police statement
// from an IncidentLog record. Uses jsPDF (already installed).

import { jsPDF } from "jspdf";
import moment from "moment";

function field(doc, label, value, x, y, maxWidth) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const text = value ? String(value) : "—";
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y + 5);
  return y + 5 + lines.length * 5 + 4;
}

export function generateZpForm32Pdf(log, caseRef) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("REPUBLIC OF ZAMBIA", pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(11);
  doc.text("ZAMBIA POLICE SERVICE", pageW / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(10);
  doc.text("VICTIM SUPPORT UNIT", pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(12);
  doc.text("ZP FORM 32 — STATEMENT OF COMPLAINT", pageW / 2, y, { align: "center" });
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Reference / case meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Case Reference: ${caseRef || log.linked_case_id || "—"}`, margin, y);
  doc.text(`Generated: ${moment().format("D MMMM YYYY, HH:mm")}`, pageW - margin, y, { align: "right" });
  y += 4;
  doc.text(`Police Report No: ${log.police_report_number || "—"}`, margin, y);
  doc.text(`Status: ${(log.status || "draft").toUpperCase()}`, pageW - margin, y, { align: "right" });
  y += 8;

  // Section: WHEN
  doc.setFillColor(255, 237, 213);
  doc.rect(margin, y, contentW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. WHEN — DATE & TIME OF INCIDENT", margin + 2, y + 4.2);
  y += 9;
  y = field(doc, "Date of incident:", log.when_date, margin, y, contentW);
  y = field(doc, "Approximate time:", log.when_time, margin, y, contentW);

  // Section: WHERE
  doc.setFillColor(255, 237, 213);
  doc.rect(margin, y, contentW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. WHERE — LOCATION", margin + 2, y + 4.2);
  y += 9;
  y = field(doc, "Location / address:", log.where_location, margin, y, contentW);
  y = field(doc, "Province:", log.where_province, margin, y, contentW);

  // Section: WHO
  doc.setFillColor(255, 237, 213);
  doc.rect(margin, y, contentW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. WHO — ALLEGED PERPETRATOR & WITNESSES", margin + 2, y + 4.2);
  y += 9;
  y = field(doc, "Alleged perpetrator (name / description / relationship):", log.who_perpetrator, margin, y, contentW);
  y = field(doc, "Witnesses:", log.who_witnesses, margin, y, contentW);

  // Page break check
  if (y > 240) { doc.addPage(); y = margin; }

  // Section: WHAT
  doc.setFillColor(255, 237, 213);
  doc.rect(margin, y, contentW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("4. WHAT — DESCRIPTION OF INCIDENT", margin + 2, y + 4.2);
  y += 9;
  y = field(doc, "What happened:", log.what_happened, margin, y, contentW);
  y = field(doc, "Injuries / harm sustained:", log.what_injuries, margin, y, contentW);

  if (y > 240) { doc.addPage(); y = margin; }

  // Section: HISTORY
  doc.setFillColor(255, 237, 213);
  doc.rect(margin, y, contentW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("5. HISTORY — PRIOR INCIDENTS", margin + 2, y + 4.2);
  y += 9;
  y = field(doc, "Prior incidents:", log.prior_incidents, margin, y, contentW);

  // Footer
  if (y > 250) { doc.addPage(); y = margin; }
  y = Math.max(y + 10, 255);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageW - margin - 70, y, pageW - margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Signature of Complainant", margin, y + 4);
  doc.text("Signature of Officer", pageW - margin - 70, y + 4);
  y += 12;
  doc.setFontSize(7);
  doc.setTextColor(100);
  const disclaimer = "This statement was recorded digitally via SafeGuard Zambia and may be used to support a formal report under the Zambia Anti-GBV Act, Cap. 123 of the Laws of Zambia. Present this document at your nearest Victim Support Unit (VSU) or Police Station.";
  doc.text(doc.splitTextToSize(disclaimer, contentW), margin, y);

  const filename = `ZP-Form-32-${caseRef || moment().format("YYYY-MM-DD-HHmm")}.pdf`;
  doc.save(filename);
  return filename;
}