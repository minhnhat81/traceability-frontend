import dayjs from "dayjs";

export const SGTIN_PREFIX = "urn:epc:id:sgtin:";

export const stripUrn = (x: string) =>
  x?.startsWith(SGTIN_PREFIX) ? x.slice(SGTIN_PREFIX.length) : x;

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

export const toIso = (d?: dayjs.Dayjs, off = "+07:00") =>
  d && dayjs(d).isValid()
    ? `${d.format("YYYY-MM-DDTHH:mm:ss")}${off}`
    : dayjs().toISOString();

export const buildPayload = (v: any, record: any, batchCode: string, tenantId: number, dppValues?: any) => {
  const ilmdExtra = entriesToObject(v?.ilmdEntries);
  return {
    tenant_id: tenantId,
    batch_code: batchCode,
    type: v?.type ?? record?.event_type ?? "ObjectEvent",
    product_code: v?.product_code ?? record?.product_code ?? "TSHIRT",
    eventTime: toIso(v?.eventTime, v?.eventTimeZoneOffset),
    bizStep: v?.bizStep,
    disposition: v?.disposition,
    action: v?.action ?? "ADD",
    epcList: (v?.epcList || []).map((e: string) =>
      e.startsWith(SGTIN_PREFIX) ? e : `${SGTIN_PREFIX}${e}`
    ),
    ilmd: {
      ...(Object.keys(ilmdExtra).length ? ilmdExtra : {}),
      dpp: dppValues,
    },
  };
};
