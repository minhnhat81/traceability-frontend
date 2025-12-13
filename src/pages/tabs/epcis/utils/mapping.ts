export const mapBizStepToEventType = (bizStep?: string) => {
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
