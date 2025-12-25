// src/i18n/exportDppPdf.ts
import jsPDF from "jspdf";
import type { DppResponse, EventItem, DocumentItem } from "../types/dpp";

/**
 * Options for PDF export
 */
type ExportPdfOptions = {
  fileName?: string;
  title?: string;
  // future: language, includeDebug, etc.
};

const safeText = (v: any) => {
  if (v === null || v === undefined) return "-";
  const s = String(v);
  return s.trim().length ? s : "-";
};

const safeDate = (v?: string | null) => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};

function shortHash(v?: string | null, head = 10, tail = 8) {
  if (!v) return "-";
  const s = String(v);
  return s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}

/**
 * Detect tier from your event fields (same logic as UI)
 */
type TierKey = "FARM" | "SUPPLIER" | "MANUFACTURER" | "BRAND" | "UNKNOWN";

function getEventTier(ev: any): TierKey {
  const rawRole = ev?.owner_role || ev?.event_owner_role || ev?.batch_owner_role || "";
  const role = String(rawRole || "").toUpperCase();

  if (role.includes("FARM")) return "FARM";
  if (role.includes("SUPPLIER")) return "SUPPLIER";
  if (role.includes("MANUFACTURER")) return "MANUFACTURER";
  if (role.includes("BRAND")) return "BRAND";

  const biz = String(ev?.biz_step || ev?.bizStep || "").toLowerCase();
  if (biz.includes("growing") || biz.includes("planting") || biz.includes("harvesting")) return "FARM";
  if (biz.includes("receiving") || biz.includes("shipping") || biz.includes("packing")) return "SUPPLIER";

  return "UNKNOWN";
}

function groupEventsByTier(events: EventItem[]) {
  const order: TierKey[] = ["FARM", "SUPPLIER", "MANUFACTURER", "BRAND", "UNKNOWN"];
  const map = new Map<TierKey, EventItem[]>();
  order.forEach((k) => map.set(k, []));

  events.forEach((ev) => {
    const tier = getEventTier(ev);
    map.get(tier)!.push(ev);
  });

  return order
    .map((k) => ({ key: k, events: map.get(k)! }))
    .filter((x) => x.events.length > 0);
}

/**
 * Get DPP attached to event (same as your DppPage.tsx)
 */
function getEventDpp(ev: any): any {
  return (ev?.ilmd?.dpp || ev?.dpp || ev?.extensions?.dpp || null) ?? null;
}

/**
 * PDF layout helpers
 */
type PdfCtx = {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  cursorY: number;
  lineHeight: number;
  fontSize: number;
};

function initPdf(title: string): PdfCtx {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text(title, 40, 48);

  doc.setFontSize(10);
  doc.text(`Generated at: ${new Date().toLocaleString()}`, 40, 66);

  doc.setDrawColor(220);
  doc.line(40, 76, pageWidth - 40, 76);

  return {
    doc,
    pageWidth,
    pageHeight,
    margin: 40,
    cursorY: 92,
    lineHeight: 14,
    fontSize: 10,
  };
}

function ensureSpace(ctx: PdfCtx, neededHeight: number) {
  const bottom = ctx.pageHeight - ctx.margin;
  if (ctx.cursorY + neededHeight <= bottom) return;

  ctx.doc.addPage();
  ctx.cursorY = ctx.margin;
}

function addSectionTitle(ctx: PdfCtx, title: string) {
  ensureSpace(ctx, 28);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(12);
  ctx.doc.text(title, ctx.margin, ctx.cursorY);
  ctx.cursorY += 16;

  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(ctx.fontSize);
}

function addParagraph(ctx: PdfCtx, text: string) {
  const maxWidth = ctx.pageWidth - ctx.margin * 2;
  const lines = ctx.doc.splitTextToSize(text, maxWidth);
  ensureSpace(ctx, lines.length * ctx.lineHeight + 8);

  ctx.doc.text(lines, ctx.margin, ctx.cursorY);
  ctx.cursorY += lines.length * ctx.lineHeight + 6;
}

function addKeyValues(ctx: PdfCtx, items: Array<{ k: string; v: any }>) {
  const maxWidth = ctx.pageWidth - ctx.margin * 2;
  const keyWidth = 140;
  const valueWidth = maxWidth - keyWidth - 10;

  items.forEach(({ k, v }) => {
    const key = safeText(k);
    const val = safeText(v);

    const valLines = ctx.doc.splitTextToSize(val, valueWidth);
    const rowHeight = Math.max(ctx.lineHeight, valLines.length * ctx.lineHeight);

    ensureSpace(ctx, rowHeight + 4);

    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.text(`${key}:`, ctx.margin, ctx.cursorY);

    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.text(valLines, ctx.margin + keyWidth, ctx.cursorY);

    ctx.cursorY += rowHeight + 4;
  });

  ctx.cursorY += 4;
}

/**
 * Extract the 16 groups you already use in UI (Annex I-like structure)
 */
function buildDppSectionsFromData(data: DppResponse) {
  // You might store DPP in various places; we try a few
  const rootAny: any = data as any;
  const dpp =
    rootAny?.dpp_json?.dpp ||
    rootAny?.dpp_json ||
    rootAny?.dpp ||
    rootAny?.batch?.dpp ||
    null;

  // If your backend doesn’t provide a single DPP root, we still export from batch/events.
  return {
    dppRoot: dpp,
  };
}

function writeBlockchain(ctx: PdfCtx, data: DppResponse) {
  addSectionTitle(ctx, "Blockchain proof");
  addKeyValues(ctx, [
    { k: "Status", v: data.blockchain?.status || "-" },
    { k: "Network", v: data.blockchain?.network || "-" },
    { k: "Tx hash", v: data.blockchain?.tx_hash || "-" },
    { k: "Block number", v: data.blockchain?.block_number ?? "-" },
    { k: "Anchored at", v: safeDate(data.blockchain?.created_at) },
    { k: "Root hash", v: data.blockchain?.root_hash || "-" },
    { k: "IPFS CID", v: data.blockchain?.ipfs_cid || "-" },
    { k: "IPFS gateway", v: data.blockchain?.ipfs_gateway || "-" },
  ]);
}

function writeIdentification(ctx: PdfCtx, data: DppResponse) {
  addSectionTitle(ctx, "Product identification & batch");
  addKeyValues(ctx, [
    { k: "Product name", v: data.batch?.product?.name || "-" },
    { k: "Brand", v: data.batch?.product?.brand || "-" },
    { k: "GTIN", v: data.batch?.product?.gtin || "-" },
    { k: "Product code", v: data.batch?.product_code || "-" },
    { k: "Batch code", v: data.batch?.batch_code || "-" },
    { k: "Manufacturing date", v: safeDate(data.batch?.mfg_date) },
    { k: "Country", v: data.batch?.country || "-" },
    {
      k: "Quantity",
      v:
        data.batch?.quantity != null
          ? `${data.batch.quantity} ${data.batch.unit || ""}`.trim()
          : "-",
    },
  ]);
}

/**
 * Build “EU Annex I-like” DPP content based on your known DPP fields
 * (same list you rendered inside table cell previously).
 */
function writeDppAnnexLike(ctx: PdfCtx, dpp: any) {
  addSectionTitle(ctx, "DPP information (Annex I-like structure)");

  if (!dpp) {
    addParagraph(ctx, "No consolidated DPP object found on this response. Export continues using batch/events data.");
    return;
  }

  // 1. Product description
  if (dpp.product_description) {
    addSectionTitle(ctx, "1) Product description");
    addKeyValues(ctx, [
      { k: "Name", v: dpp.product_description.name },
      { k: "Model", v: dpp.product_description.model },
      { k: "GTIN", v: dpp.product_description.gtin },
      { k: "Category", v: dpp.product_description.category },
      { k: "Description", v: dpp.product_description.description },
    ]);
  }

  // 2. Composition
  if (dpp.composition) {
    addSectionTitle(ctx, "2) Composition");
    const mats =
      dpp.composition.materials?.join(", ") ||
      dpp.composition.materials_block
        ?.map((m: any) => `${safeText(m.name)} ${m.percentage != null ? `${m.percentage}%` : ""}`.trim())
        .filter(Boolean)
        .join(", ");

    addKeyValues(ctx, [
      { k: "Materials", v: mats || "-" },
      { k: "Notes", v: dpp.composition.notes },
    ]);
  }

  // 3. Use phase
  if (dpp.use_phase) {
    addSectionTitle(ctx, "3) Use phase");
    addKeyValues(ctx, [
      { k: "Instructions", v: dpp.use_phase.instructions },
      { k: "Care", v: dpp.use_phase.care },
      { k: "Warranty", v: dpp.use_phase.warranty },
    ]);
  }

  // 4. Brand
  if (dpp.brand_info) {
    addSectionTitle(ctx, "4) Brand information");
    addKeyValues(ctx, [
      { k: "Brand", v: dpp.brand_info.brand },
      { k: "Contact", v: dpp.brand_info.contact },
      { k: "Address", v: dpp.brand_info.address },
      { k: "Website", v: dpp.brand_info.website },
    ]);
  }

  // 5. Social impact
  if (dpp.social_impact) {
    addSectionTitle(ctx, "5) Social impact");
    const certText = Array.isArray(dpp.social_impact.certifications)
      ? dpp.social_impact.certifications
          .map((c: any) => `${safeText(c.name)}${c.number ? ` (${c.number})` : ""}`.trim())
          .filter(Boolean)
          .join(", ")
      : "-";
    addKeyValues(ctx, [
      { k: "Factory", v: dpp.social_impact.factory },
      { k: "Certifications", v: certText },
      { k: "Notes", v: dpp.social_impact.notes },
    ]);
  }

  // 6. Animal welfare
  if (dpp.animal_welfare) {
    addSectionTitle(ctx, "6) Animal welfare");
    addKeyValues(ctx, [
      { k: "Standard", v: dpp.animal_welfare.standard },
      { k: "Notes", v: dpp.animal_welfare.notes },
    ]);
  }

  // 7. End of life
  if (dpp.end_of_life) {
    addSectionTitle(ctx, "7) End-of-life");
    addKeyValues(ctx, [
      { k: "Recycle guideline", v: dpp.end_of_life.recycle_guideline },
      { k: "Take-back", v: dpp.end_of_life.take_back },
      { k: "Notes", v: dpp.end_of_life.notes },
    ]);
  }

  // 8. Health & safety
  if (dpp.health_safety) {
    addSectionTitle(ctx, "8) Health & safety");
    addKeyValues(ctx, [
      { k: "Policy", v: dpp.health_safety.policy },
      { k: "Certified by", v: dpp.health_safety.certified_by },
      { k: "Notes", v: dpp.health_safety.notes },
    ]);
  }

  // 9. Digital identity
  if (dpp.digital_identity) {
    addSectionTitle(ctx, "9) Digital identity");
    addKeyValues(ctx, [
      { k: "DID", v: dpp.digital_identity.did },
      { k: "IPFS CID", v: dpp.digital_identity.ipfs_cid },
      { k: "Notes", v: dpp.digital_identity.notes },
    ]);
  }

  // 10. Environmental impact
  if (dpp.environmental_impact) {
    addSectionTitle(ctx, "10) Environmental impact");
    addKeyValues(ctx, [
      { k: "CO2", v: dpp.environmental_impact.co2 },
      { k: "Water", v: dpp.environmental_impact.water },
      { k: "Energy", v: dpp.environmental_impact.energy },
      { k: "Notes", v: dpp.environmental_impact.notes },
    ]);
  }

  // 11. Circularity
  if (dpp.circularity) {
    addSectionTitle(ctx, "11) Circularity");
    addKeyValues(ctx, [
      { k: "Recycled content", v: dpp.circularity.recycled_content },
      { k: "Reusability", v: dpp.circularity.reusability },
      { k: "Waste reduction", v: dpp.circularity.waste_reduction },
      { k: "Notes", v: dpp.circularity.notes },
    ]);
  }

  // 12. Quantity info
  if (dpp.quantity_info) {
    addSectionTitle(ctx, "12) Quantity information");
    addKeyValues(ctx, [
      { k: "Batch", v: dpp.quantity_info.batch },
      { k: "Weight", v: dpp.quantity_info.weight },
      { k: "Unit", v: dpp.quantity_info.unit },
    ]);
  }

  // 13. Cost info
  if (dpp.cost_info) {
    addSectionTitle(ctx, "13) Cost information");
    addKeyValues(ctx, [
      { k: "Labor cost", v: dpp.cost_info.labor_cost },
      { k: "Transport cost", v: dpp.cost_info.transport_cost },
      { k: "Currency", v: dpp.cost_info.currency },
    ]);
  }

  // 14. Transport
  if (dpp.transport) {
    addSectionTitle(ctx, "14) Transport");
    addKeyValues(ctx, [
      { k: "Distance", v: dpp.transport.distance },
      { k: "CO2 per km", v: dpp.transport.co2_per_km },
      { k: "Mode", v: dpp.transport.mode },
      { k: "Notes", v: dpp.transport.notes },
    ]);
  }

  // 15. Documentation
  if (dpp.documentation) {
    addSectionTitle(ctx, "15) Documentation");
    addKeyValues(ctx, [
      { k: "File", v: dpp.documentation.file },
      { k: "Issued by", v: dpp.documentation.issued_by },
      { k: "Issued at", v: safeDate(dpp.documentation.issued_at) },
      { k: "Notes", v: dpp.documentation.notes },
    ]);
  }

  // 16. Supply chain
  if (dpp.supply_chain) {
    addSectionTitle(ctx, "16) Supply chain");
    addKeyValues(ctx, [
      { k: "Tier", v: dpp.supply_chain.tier },
      { k: "Supplier", v: dpp.supply_chain.supplier },
      { k: "Updated at", v: safeDate(dpp.supply_chain.updated_at) },
      { k: "Notes", v: dpp.supply_chain.notes },
    ]);
  }
}

function writeDocuments(ctx: PdfCtx, docs: DocumentItem[] | undefined) {
  addSectionTitle(ctx, "Documents & credentials");
  if (!docs || docs.length === 0) {
    addParagraph(ctx, "No documents available.");
    return;
  }

  docs.forEach((d, idx) => {
    ensureSpace(ctx, 44);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.text(`${idx + 1}. ${safeText((d as any).file_name)}`, ctx.margin, ctx.cursorY);
    ctx.cursorY += 14;

    ctx.doc.setFont("helvetica", "normal");
    addKeyValues(ctx, [
      { k: "VC status", v: (d as any).vc_status || "-" },
      { k: "Bundle", v: (d as any).doc_bundle_id || "-" },
      { k: "File hash", v: shortHash((d as any).file_hash || "-", 10, 10) },
    ]);
  });
}

function writeEventsTimeline(ctx: PdfCtx, events: EventItem[]) {
  addSectionTitle(ctx, "Traceability events (EPCIS timeline)");

  if (!events || events.length === 0) {
    addParagraph(ctx, "No EPCIS events found.");
    return;
  }

  // Sort by event_time ascending
  const sorted = [...events].sort((a: any, b: any) => {
    const ta = new Date((a as any).event_time || (a as any).eventTime || 0).getTime();
    const tb = new Date((b as any).event_time || (b as any).eventTime || 0).getTime();
    return ta - tb;
  });

  const tiers = groupEventsByTier(sorted);

  tiers.forEach((tier) => {
    addSectionTitle(ctx, `Tier: ${tier.key} (${tier.events.length} events)`);

    tier.events.forEach((ev: any, idx) => {
      const time = safeDate(ev.event_time || ev.eventTime);
      const id = safeText(ev.event_id || ev.id);
      const type = safeText(ev.event_type || ev.type);
      const biz = safeText(ev.biz_step || ev.bizStep);
      const action = safeText(ev.action);
      const rp = safeText(ev.read_point || ev.readPoint);
      const bl = safeText(ev.biz_location || ev.bizLocation);

      ensureSpace(ctx, 86);

      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.text(`${idx + 1}) ${time}`, ctx.margin, ctx.cursorY);
      ctx.cursorY += 14;

      ctx.doc.setFont("helvetica", "normal");
      addKeyValues(ctx, [
        { k: "Event ID", v: id },
        { k: "Type", v: type },
        { k: "Action", v: action },
        { k: "Biz step", v: biz },
        { k: "Read point", v: rp },
        { k: "Biz location", v: bl },
      ]);

      // DPP attached to event (important!)
      const dpp = getEventDpp(ev);
      if (dpp) {
        addParagraph(ctx, "Event DPP snapshot:");
        // Keep it compact: same “summary lines” as UI cell
        const lines: string[] = [];

        if (dpp.product_description) {
          lines.push(
            `Product: ${[dpp.product_description.name, dpp.product_description.model, dpp.product_description.gtin]
              .filter(Boolean)
              .join(" — ")}`
          );
        }
        if (dpp.composition) {
          const mats =
            dpp.composition.materials?.join(", ") ||
            dpp.composition.materials_block
              ?.map((m: any) => `${safeText(m.name)} ${m.percentage != null ? `${m.percentage}%` : ""}`.trim())
              .filter(Boolean)
              .join(", ");
          if (mats) lines.push(`Composition: ${mats}`);
        }
        if (dpp.use_phase?.instructions) lines.push(`Use: ${dpp.use_phase.instructions}`);
        if (dpp.brand_info?.brand) lines.push(`Brand: ${dpp.brand_info.brand}`);
        if (dpp.social_impact?.factory) lines.push(`Social: ${dpp.social_impact.factory}`);
        if (dpp.end_of_life?.recycle_guideline) lines.push(`End-of-life: ${dpp.end_of_life.recycle_guideline}`);
        if (dpp.digital_identity?.did) lines.push(`DID: ${dpp.digital_identity.did}`);
        if (dpp.environmental_impact) {
          const e = dpp.environmental_impact;
          const envLine = ["co2", "water", "energy"]
            .map((k) => (e[k] != null ? `${k.toUpperCase()}: ${e[k]}` : ""))
            .filter(Boolean)
            .join(" | ");
          if (envLine) lines.push(`Environment: ${envLine}`);
        }

        addParagraph(ctx, lines.length ? lines.join("\n") : "(No structured DPP fields found on event)");
      }

      ctx.cursorY += 6;
      ctx.doc.setDrawColor(235);
      ctx.doc.line(ctx.margin, ctx.cursorY, ctx.pageWidth - ctx.margin, ctx.cursorY);
      ctx.cursorY += 12;
    });
  });
}

/**
 * MAIN EXPORT FUNCTION
 */
export async function exportAndDownloadDppPdf(
  data: DppResponse,
  allEvents: EventItem[],
  opts: ExportPdfOptions = {}
) {
  const title = opts.title || "EU Digital Product Passport (DPP)";
  const fileName =
    opts.fileName || `DPP_${(data as any)?.batch?.batch_code || "export"}.pdf`;

  const ctx = initPdf(title);

  // --- Identification
  writeIdentification(ctx, data);

  // --- Blockchain proof
  writeBlockchain(ctx, data);

  // --- Annex I-like DPP sections (from consolidated DPP root if available)
  const { dppRoot } = buildDppSectionsFromData(data);
  writeDppAnnexLike(ctx, dppRoot);

  // --- Documents
  writeDocuments(ctx, (data as any).documents as DocumentItem[] | undefined);

  // --- Events timeline (incl. event-level DPP snapshots)
  writeEventsTimeline(ctx, allEvents || []);

  // footer page numbers
  const pageCount = ctx.doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    ctx.doc.setPage(i);
    ctx.doc.setFontSize(9);
    ctx.doc.setTextColor(120);
    ctx.doc.text(
      `Page ${i} / ${pageCount}`,
      ctx.pageWidth - ctx.margin,
      ctx.pageHeight - 18,
      { align: "right" }
    );
  }

  ctx.doc.save(fileName);
}
