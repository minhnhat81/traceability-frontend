export type Group =
  | "product_description"
  | "composition"
  | "social_impact"
  | "animal_welfare"
  | "health_safety"
  | "brand_info"
  | "use_phase"
  | "end_of_life"
  | "digital_identity"
  | "environmental_impact"
  | "quantity_info"
  | "cost_info"
  | "transport"
  | "documentation"
  | "supply_chain"
  | "schema_metadata";

export type EventType =
  | "commissioning"
  | "transformation"
  | "packing"
  | "aggregation"
  | "shipping"
  | "receiving"
  | "customs"
  | "observation";

export const DPP_MAPPING: Record<
  EventType,
  { required: Group[]; optional: Group[] }
> = {
  commissioning: {
    required: [
      "product_description",
      "composition",
      "social_impact",
      "supply_chain",
      "digital_identity",
    ],
    optional: ["environmental_impact", "documentation", "schema_metadata"],
  },
  transformation: {
    required: [
      "product_description",
      "composition",
      "health_safety",
      "quantity_info",
      "digital_identity",
    ],
    optional: [
      "environmental_impact",
      "documentation",
      "supply_chain",
      "cost_info",
    ],
  },
  packing: {
    required: [
      "product_description",
      "quantity_info",
      "digital_identity",
      "transport",
    ],
    optional: ["documentation", "supply_chain", "schema_metadata", "environmental_impact"],
  },
  aggregation: {
    required: ["product_description", "quantity_info", "digital_identity"],
    optional: ["transport", "documentation", "schema_metadata"],
  },
  shipping: {
    required: [
      "product_description",
      "transport",
      "documentation",
      "supply_chain",
      "digital_identity",
    ],
    optional: ["environmental_impact", "schema_metadata", "cost_info"],
  },
  receiving: {
    required: [
      "product_description",
      "documentation",
      "supply_chain",
      "digital_identity",
    ],
    optional: ["transport", "schema_metadata"],
  },
  customs: {
    required: [
      "product_description",
      "documentation",
      "supply_chain",
      "schema_metadata",
    ],
    optional: ["transport", "digital_identity", "environmental_impact"],
  },
  observation: {
    required: ["end_of_life", "digital_identity", "schema_metadata"],
    optional: ["environmental_impact", "documentation"],
  },
};
