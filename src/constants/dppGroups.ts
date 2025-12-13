export const DPP_STATIC_GROUPS = [
  {
    key: 'product_description',
    label: 'Product Description',
    fields: [
      { name: 'gtin', label: 'GTIN (Global Trade Item Number)', type: 'string', tooltip: 'e.g. 1234567890123' },
      { name: 'name', label: 'Product Name', type: 'string', tooltip: 'e.g. Organic Cotton T-Shirt' },
      { name: 'model', label: 'Model Number', type: 'string', tooltip: 'e.g. TS-2025-01' },
    ],
  },
  {
    key: 'composition',
    label: 'Material Composition',
    fields: [
      { name: 'materials', label: 'Materials', type: 'array', tooltip: 'List of materials, e.g. ["Cotton","Polyester"]' },
      { name: 'percentages', label: 'Percentages', type: 'array', tooltip: 'e.g. [80,20]' },
    ],
  },
  {
    key: 'social_impact',
    label: 'Social Impact',
    fields: [
      { name: 'factory', label: 'Factory Name', type: 'string', tooltip: 'e.g. Eco Textile Vietnam' },
      { name: 'certifications', label: 'Certifications', type: 'array', tooltip: 'e.g. ["FairTrade", "SA8000"]' },
    ],
  },
  {
    key: 'animal_welfare',
    label: 'Animal Welfare',
    fields: [
      { name: 'standard', label: 'Standard', type: 'string', tooltip: 'e.g. Responsible Wool Standard' },
      { name: 'notes', label: 'Notes', type: 'string', tooltip: 'e.g. No animal testing' },
    ],
  },
  {
    key: 'health_safety',
    label: 'Health & Safety',
    fields: [
      { name: 'policy', label: 'Policy', type: 'string', tooltip: 'e.g. ISO 45001 compliant' },
      { name: 'certified_by', label: 'Certified By', type: 'string', tooltip: 'e.g. SGS' },
    ],
  },
  {
    key: 'brand_info',
    label: 'Brand Information',
    fields: [
      { name: 'brand', label: 'Brand Name', type: 'string', tooltip: 'e.g. GreenWear' },
      { name: 'contact', label: 'Brand Contact', type: 'string', tooltip: 'e.g. info@greenwear.com' },
    ],
  },
  {
    key: 'use_phase',
    label: 'Use Phase',
    fields: [
      { name: 'instructions', label: 'Care Instructions', type: 'string', tooltip: 'e.g. Machine wash cold, line dry' },
    ],
  },
  {
    key: 'end_of_life',
    label: 'End of Life',
    fields: [
      { name: 'recycle_guideline', label: 'Recycle Guideline', type: 'string', tooltip: 'e.g. Separate fabrics for recycling' },
    ],
  },
  {
    key: 'digital_identity',
    label: 'Digital Identity',
    fields: [
      { name: 'qr', label: 'QR Code URL', type: 'string', tooltip: 'e.g. https://example.com/qr' },
      { name: 'did', label: 'Decentralized ID (DID)', type: 'string', tooltip: 'e.g. did:example:123456' },
      { name: 'ipfs_cid', label: 'IPFS CID', type: 'string', tooltip: 'e.g. Qmabc123...' },
    ],
  },
]

export const DPP_DYNAMIC_GROUPS = [
  {
    key: 'environmental_impact',
    label: 'Environmental Impact',
    fields: [
      { name: 'co2', label: 'CO₂ Emissions (kg)', type: 'number', tooltip: 'e.g. 3.2' },
      { name: 'water', label: 'Water Use (L)', type: 'number', tooltip: 'e.g. 1200' },
      { name: 'electricity', label: 'Electricity (kWh)', type: 'number', tooltip: 'e.g. 2.5' },
    ],
  },
  {
    key: 'circularity',
    label: 'Circularity',
    fields: [
      { name: 'waste_reused', label: 'Waste Reused (%)', type: 'number', tooltip: 'e.g. 75' },
      { name: 'packaging_recycled', label: 'Packaging Recycled (%)', type: 'number', tooltip: 'e.g. 80' },
    ],
  },
  {
    key: 'quantity_info',
    label: 'Quantity Information',
    fields: [
      { name: 'batch', label: 'Batch Number', type: 'string', tooltip: 'e.g. BATCH-2025-01' },
      { name: 'weight', label: 'Weight (kg)', type: 'number', tooltip: 'e.g. 12.5' },
    ],
  },
  {
    key: 'cost_info',
    label: 'Cost Information',
    fields: [
      { name: 'labor_cost', label: 'Labor Cost (USD)', type: 'number', tooltip: 'e.g. 1.2' },
      { name: 'transport_cost', label: 'Transport Cost (USD)', type: 'number', tooltip: 'e.g. 0.8' },
    ],
  },
  {
    key: 'transport',
    label: 'Transport',
    fields: [
      { name: 'distance_km', label: 'Distance (km)', type: 'number', tooltip: 'e.g. 300' },
      { name: 'co2_per_km', label: 'CO₂ per km (kg)', type: 'number', tooltip: 'e.g. 0.002' },
    ],
  },
  {
    key: 'documentation',
    label: 'Documentation',
    fields: [
      { name: 'file', label: 'File Name / URL', type: 'string', tooltip: 'e.g. certificate.pdf' },
      { name: 'issued_by', label: 'Issued By', type: 'string', tooltip: 'e.g. SGS' },
    ],
  },
  {
    key: 'supply_chain',
    label: 'Supply Chain',
    fields: [
      { name: 'tier', label: 'Tier Level', type: 'number', tooltip: 'e.g. 3' },
      { name: 'supplier', label: 'Supplier Name', type: 'string', tooltip: 'e.g. Cotton Supplier Ltd.' },
      { name: 'updated_at', label: 'Updated At', type: 'string', tooltip: 'e.g. 2025-01-01' },
    ],
  },
]
