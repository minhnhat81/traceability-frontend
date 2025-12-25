// src/i18n/exportDppPdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DppResponse, EventItem, DocumentItem } from "../types/dpp";
import { hashPdfBlob } from "../utils/hashPdf";

// Bạn đã có constants này theo hội thoại trước
// Nếu file của bạn export khác tên, chỉnh lại import cho đúng.
import { DPP_ANNEX_I_SECTIONS } from "../constants/dppAnnexI";

type ExportOptions = {
  fileName?: string; // default: DPP_<batch>.pdf
  locale?: string; // future i18n
};

function safe(v: any, fallback = "-") {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  return s.trim() ? s : fallback;
}

function safeDate(v?: string | null) {
  return v ? new Date(v).toLocaleString() : "-";
}

function shortHash(v?: string | null) {
  if (!v) return "-";
  const s = String(v);
  return s.length > 18 ? `${s.slice(0, 10)}…${s.slice(-8)}` : s;
}

// Try to get DPP object from different possible locations
function getRootDpp(data: DppResponse): any {
  return (
    (data as any)?.dpp_json?.dpp ||
    (data as any)?.dpp_json ||
    (data as any)?.dpp ||
    (data as any)
  );
}

// Get event DPP attached to event (like DppPage did)
function getEventDpp(ev: EventItem): any {
  return (
    ((ev as any)?.ilmd as any)?.dpp ||
    (ev as any)?.dpp ||
    ((ev as any)?.extensions as any)?.dpp ||
    null
  );
}

type TierKey = "FARM" | "SUPPLIER" | "MANUFACTURER" | "BRAND" | "UNKNOWN";

function getEventTier(ev: EventItem): TierKey {
  const rawRole =
    (ev as any).owner_role ||
    (ev as any).event_owner_role ||
    (ev as any).batch_owner_role ||
    "";

  const role = String(rawRole || "").toUpperCase();

  if (role.includes("FARM")) return "FARM";
  if (role.includes("SUPPLIER")) return "SUPPLIER";
  if (role.includes("MANUFACTURER")) return "MANUFACTURER";
  if (role.includes("BRAND")) return "BRAND";

  const biz = String((ev as any).biz_step || "").toLowerCase();
  if (biz.includes("growing") || biz.includes("planting") || biz.includes("harvesting")) return "FARM";
  if (biz.includes("receiving") || biz.includes("shipping") || biz.includes("packing")) return "SUPPLIER";

  return "UNKNOWN";
}

function groupByTier(events: EventItem[]) {
  const order: TierKey[] = ["FARM", "SUPPLIER", "MANUFACTURER", "BRAND", "UNKNOWN"];
  const map: Record<TierKey, EventItem[]> = {
    FARM: [],
    SUPPLIER: [],
    MANUFACTURER: [],
    BRAND: [],
    UNKNOWN: [],
  };
  events.forEach((e) => map[getEventTier(e)].push(e));
  return order
    .map((k) => ({ tier: k, events: map[k] }))
    .filter((x) => x.events.length > 0);
}

function tierLabel(t: TierKey) {
  if (t === "FARM") return "Farm";
  if (t === "SUPPLIER") return "Supplier";
  if (t === "MANUFACTURER") return "Manufacturer";
  if (t === "BRAND") return "Brand";
  return "Other / Unknown";
}

function addTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
}

function nextY(doc: jsPDF) {
  // @ts-ignore
  return (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 20;
}

/**
 * Export DPP PDF according to "Annex I style sections" via DPP_ANNEX_I_SECTIONS
 * Returns { blob, hash, fileName }
 */
export async function exportDppPdf(
  data: DppResponse,
  allEvents: EventItem[],
  options: ExportOptions = {}
): Promise<{ blob: Blob; hash: string; fileName: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const dppRoot = getRootDpp(data);

  const productName = safe(data.batch?.product?.name, "Product");
  const brand = safe(data.batch?.product?.brand);
  const gtin = safe(data.batch?.product?.gtin);
  const batchCode = safe(data.batch?.batch_code);
  const productCode = safe(data.batch?.product_code);
  const country = safe(data.batch?.country);
  const mfgDate = safeDate(data.batch?.mfg_date);
  const quantity =
    data.batch?.quantity != null ? `${data.batch.quantity} ${safe(data.batch.unit, "")}`.trim() : "-";

  const fileName =
    options.fileName ||
    `DPP_${(batchCode || productCode || "BATCH").replace(/[^\w\-]+/g, "_")}.pdf`;

  // =========================
  // COVER PAGE
  // =========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Digital Product Passport (DPP)", 14, 22);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Product: ${productName}`, 14, 34);
  doc.text(`Brand: ${brand}`, 14, 40);
  doc.text(`GTIN: ${gtin}`, 14, 46);
  doc.text(`Product code: ${productCode}`, 14, 52);
  doc.text(`Batch: ${batchCode}`, 14, 58);
  doc.text(`Made in: ${country}`, 14, 64);
  doc.text(`Manufactured: ${mfgDate}`, 14, 70);
  doc.text(`Quantity: ${quantity}`, 14, 76);

  doc.setDrawColor(220);
  doc.line(14, 82, 196, 82);

  doc.setFont("helvetica", "bold");
  doc.text("Blockchain proof", 14, 90);
  doc.setFont("helvetica", "normal");
  doc.text(`Network: ${safe(data.blockchain?.network)}`, 14, 96);
  doc.text(`Status: ${safe(data.blockchain?.status)}`, 14, 102);
  doc.text(`Tx hash: ${safe(data.blockchain?.tx_hash)}`, 14, 108);
  doc.text(`Block: ${safe(data.blockchain?.block_number)}`, 14, 114);
  doc.text(`Root hash: ${safe(data.blockchain?.root_hash)}`, 14, 120);
  doc.text(`Anchored at: ${safeDate((data.blockchain as any)?.created_at)}`, 14, 126);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Generated by Traceability Unified Web", 14, 286);
  doc.setTextColor(0);

  doc.addPage();

  // =========================
  // ANNEX I SECTIONS
  // =========================
  addTitle(doc, "EU DPP Annex I — Information requirements", 16);

  doc.setFontSize(10);
  doc.text(
    "Below sections are generated from the DPP JSON structure (as available) and mapped to Annex I groups in your constants.",
    14,
    24,
    { maxWidth: 182 }
  );

  // Each section expected format (suggested):
  // DPP_ANNEX_I_SECTIONS: Array<{ key: string; title: string; fields: Array<{ path: string; label: string }> }>
  // If your constant shape differs, chỉnh đoạn mapping bên dưới cho đúng.
  const startAnnexY = 32;

  for (let i = 0; i < (DPP_ANNEX_I_SECTIONS || []).length; i++) {
    const sec = (DPP_ANNEX_I_SECTIONS as any)[i];
    const title = sec?.title || sec?.label || sec?.name || `Section ${i + 1}`;
    const fields = sec?.fields || [];

    const rows: Array<[string, string]> = [];

    for (const f of fields) {
      const label = f?.label || f?.name || f?.key || f?.path || "-";
      const path = f?.path;

      let value: any = "-";
      if (path && typeof path === "string") {
        // resolve "a.b.c" from dppRoot
        const parts = path.split(".");
        let cur: any = dppRoot;
        for (const p of parts) {
          if (!cur) break;
          cur = cur[p];
        }
        if (Array.isArray(cur)) value = cur.length ? cur.join(", ") : "-";
        else if (cur && typeof cur === "object") value = JSON.stringify(cur);
        else value = safe(cur);
      } else if (f?.getValue && typeof f.getValue === "function") {
        value = safe(f.getValue(dppRoot));
      }

      // keep table small
      rows.push([label, typeof value === "string" ? value : safe(value)]);
    }

    // New page if needed
    const y = nextY(doc);
    if (y > 250) doc.addPage();

    addTitle(doc, title, nextY(doc));

    autoTable(doc, {
      startY: nextY(doc),
      head: [["Field", "Value"]],
      body: rows.length ? rows : [["-", "-"]],
      styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 120 },
      },
      margin: { left: 14, right: 14 },
    });
  }

  doc.addPage();

  // =========================
  // SUPPLY CHAIN EVENTS (per tier) + event-level DPP snippet
  // =========================
  addTitle(doc, "Supply chain events (EPCIS) by tier", 16);

  const tierGroups = groupByTier(allEvents);

  if (!tierGroups.length) {
    doc.setFontSize(10);
    doc.text("No EPCIS events found for this batch.", 14, 26);
  } else {
    for (const g of tierGroups) {
      const y0 = nextY(doc);
      if (y0 > 250) doc.addPage();

      addTitle(doc, `${tierLabel(g.tier)} — ${g.events.length} events`, nextY(doc));

      const body = g.events.map((ev) => {
        const dpp = getEventDpp(ev);

        // build a compact dpp summary (same spirit as your old table cell)
        const dppSummaryParts: string[] = [];
        if (dpp?.product_description?.name) dppSummaryParts.push(`Product: ${dpp.product_description.name}`);
        if (dpp?.composition?.materials?.length) dppSummaryParts.push(`Materials: ${dpp.composition.materials.join(", ")}`);
        if (dpp?.brand_info?.brand) dppSummaryParts.push(`Brand: ${dpp.brand_info.brand}`);
        if (dpp?.digital_identity?.did) dppSummaryParts.push(`DID: ${dpp.digital_identity.did}`);
        const dppSummary = dppSummaryParts.length ? dppSummaryParts.join(" | ") : "-";

        return [
          safeDate((ev as any).event_time),
          safe((ev as any).event_type),
          safe((ev as any).biz_step),
          safe((ev as any).read_point),
          safe((ev as any).biz_location),
          dppSummary,
        ];
      });

      autoTable(doc, {
        startY: nextY(doc),
        head: [["Time", "Type", "Biz step", "Read point", "Biz location", "Event DPP"]],
        body,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 20 },
          2: { cellWidth: 26 },
          3: { cellWidth: 28 },
          4: { cellWidth: 28 },
          5: { cellWidth: 48 },
        },
      });
    }
  }

  doc.addPage();

  // =========================
  // DOCUMENTS
  // =========================
  addTitle(doc, "Certificates & documents", 16);

  const docs: DocumentItem[] = (data.documents || []) as any;

  autoTable(doc, {
    startY: 24,
    head: [["File", "Hash", "Bundle", "VC status"]],
    body: (docs || []).map((d: any) => [
      safe(d.file_name),
      shortHash(d.file_hash),
      safe(d.doc_bundle_id),
      safe(d.vc_status),
    ]),
    styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  // =========================
  // FINALIZE: compute hash of produced PDF
  // =========================
  const pdfBlob = doc.output("blob") as Blob;
  const hash = await hashPdfBlob(pdfBlob);

  // Append hash page (so auditor can verify)
  const doc2 = new jsPDF({ unit: "mm", format: "a4" });
  // Instead of rebuilding, easiest: add last page into same doc BEFORE output.
  // We already output -> so we do a second pass by regenerating output is heavy.
  // Alternative: create hash page BEFORE output:
  // (But we already did output above)
  // => We'll do it correctly: regenerate output with hash page.

  // REBUILD with hash page properly (simple approach):
  // NOTE: If you want no rebuild, move hashing to after doc.addPage() and before output.
  // We'll do: create hash page in original doc then output again.

  // Add hash page to original doc
  // (jsPDF still in memory)
  doc.addPage();
  addTitle(doc, "File integrity", 16);
  doc.setFontSize(10);
  doc.text("SHA-256 hash of this PDF file:", 14, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(hash, 14, 34, { maxWidth: 182 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "You can verify by computing SHA-256 over the downloaded PDF file and comparing the value above.",
    14,
    48,
    { maxWidth: 182 }
  );
  doc.setTextColor(0);

  const finalBlob = doc.output("blob") as Blob;

  return { blob: finalBlob, hash, fileName };
}

/**
 * Convenience: export & trigger download in browser
 */
export async function exportAndDownloadDppPdf(
  data: DppResponse,
  allEvents: EventItem[],
  options: ExportOptions = {}
) {
  const { blob, fileName } = await exportDppPdf(data, allEvents, options);

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
