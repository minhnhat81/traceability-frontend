export const EVENT_TYPES = ["ObjectEvent", "AggregationEvent", "TransformationEvent", "AssociationEvent"];
export const ACTIONS = ["ADD", "OBSERVE", "DELETE"];
export const BIZ_STEPS = [
  { label: "Commissioning", value: "urn:epcglobal:cbv:bizstep:commissioning" },
  { label: "Receiving", value: "urn:epcglobal:cbv:bizstep:receiving" },
  { label: "Manufacturing", value: "urn:epcglobal:cbv:bizstep:manufacturing" },
  { label: "Packing", value: "urn:epcglobal:cbv:bizstep:packing" },
  { label: "Shipping", value: "urn:epcglobal:cbv:bizstep:shipping" },
  { label: "Storing", value: "urn:epcglobal:cbv:bizstep:storing" },
  { label: "Inspection", value: "urn:epcglobal:cbv:bizstep:inspecting" },
  { label: "Retail", value: "urn:epcglobal:cbv:bizstep:retail_selling" },
];
export const DISPOSITIONS = [
  { label: "Active", value: "urn:epcglobal:cbv:disp:active" },
  { label: "In Progress", value: "urn:epcglobal:cbv:disp:in_progress" },
  { label: "Packed", value: "urn:epcglobal:cbv:disp:packed" },
  { label: "In Transit", value: "urn:epcglobal:cbv:disp:in_transit" },
  { label: "Damaged", value: "urn:epcglobal:cbv:disp:damaged" },
  { label: "Expired", value: "urn:epcglobal:cbv:disp:expired" },
  { label: "Destroyed", value: "urn:epcglobal:cbv:disp:destroyed" },
];
