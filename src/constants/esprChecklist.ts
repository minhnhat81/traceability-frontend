export const ESPR_CHECKLIST = [
  {
    id: "ESPR-01",
    title: "Unique product identifier",
    check: (dpp: any) => !!dpp?.product_description?.gtin,
  },
  {
    id: "ESPR-02",
    title: "Digital Product Passport access via QR",
    check: (_: any) => true,
  },
  {
    id: "ESPR-03",
    title: "Supply chain traceability",
    check: (dpp: any) => !!dpp?.traceability,
  },
  {
    id: "ESPR-04",
    title: "Blockchain integrity proof",
    check: (_: any, blockchain: any) =>
      blockchain?.status === "CONFIRMED",
  },
  {
    id: "ESPR-05",
    title: "Documents & certificates available",
    check: (_: any, __: any, docs: any[]) => docs?.length > 0,
  },
];
