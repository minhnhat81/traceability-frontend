import dayjs from "dayjs";
import { DPP_MAPPING } from "@/configs/DPP_MAPPING";

export const toIso = (d: any, off = "+07:00") =>
  d && dayjs(d).isValid()
    ? `${d.format("YYYY-MM-DDTHH:mm:ss")}${off}`
    : dayjs().toISOString();

export const stripUrn = (x: string) =>
  x?.startsWith("urn:epc:id:sgtin:") ? x.slice(17) : x;

export const safeJson = (s: string) => {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};

export const entriesToObject = (entries?: { key?: string; value?: string }[]) => {
  const obj: Record<string, any> = {};
  (entries || []).forEach((it) => {
    const k = String(it?.key || "").trim();
    if (!k) return;
    obj[k] = safeJson(it?.value ?? "");
  });
  return obj;
};

export const mapBizStepToEventType = (bizStep?: string): keyof typeof DPP_MAPPING => {
  const s = (bizStep || "").toLowerCase();
  if (s.includes(":commissioning")) return "commissioning";
  if (s.includes(":manufacturing")) return "transformation";
  if (s.includes(":packing")) return "packing";
  if (s.includes(":shipping")) return "shipping";
  if (s.includes(":receiving")) return "receiving";
  if (s.includes(":inspecting") || s.includes(":retail")) return "observation";
  if (s.includes(":storing")) return "observation";
  return "commissioning";
};
