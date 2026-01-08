import React, { useEffect, useState } from "react";
import {
  Modal,
  Select,
  Collapse,
  Checkbox,
  Input,
  Button,
  Space,
  message,
  Spin,
  Typography,
  Empty,
  Divider,
} from "antd";
import { ReloadOutlined, DatabaseOutlined } from "@ant-design/icons";
import { listDppTemplates } from "../../../../services/dpp_templatesService";

const { Panel } = Collapse;
const { Text } = Typography;

interface DPPPanelProps {
  open: boolean;
  onCancel: () => void;
  eventTypeKey: string;
  onChange: (v: any) => void;
  initialValues?: Record<string, any>;
}

interface DppTemplate {
  id: number;
  name: string;
  description?: string;
  schema?: any;
  static_data?: any;
  dynamic_data?: any;
  created_at?: string;
}

// ✅ helper nhỏ để TS khỏi suy ra "never"
function hasItemsArray(x: any): x is { items: DppTemplate[] } {
  return !!x && Array.isArray(x.items);
}

const DPPPanel: React.FC<DPPPanelProps> = ({
  open,
  onCancel,
  eventTypeKey,
  onChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<DppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DppTemplate | null>(
    null
  );
  const [selectedGroups, setSelectedGroups] = useState<Record<string, any>>({});
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const requiredGroups = [
    "product_description",
    "composition",
    "social_impact",
    "animal_welfare",
    "health_safety",
    "brand_info",
    "use_phase",
    "end_of_life",
  ];

  const optionalGroups = [
    "digital_identity",
    "environmental_impact",
    "circularity",
    "quantity_info",
    "cost_info",
    "transport",
    "documentation",
    "supply_chain",
  ];

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      // ✅ FIX (không đổi logic): ép kiểu data để tránh "never"
      const data: any = await listDppTemplates();

      if (Array.isArray(data)) setTemplates(data);
      else if (hasItemsArray(data)) setTemplates(data.items);
      else setTemplates([]);
    } catch (err) {
      console.error("Failed to load templates:", err);
      message.error("Failed to load DPP templates from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTemplates();
      setSelectedTemplate(null);
      setSelectedGroups({});
      setEditValues({});
    }
  }, [open]);

  const handleSelectTemplate = (id: number) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSelectedTemplate(tpl);
    setSelectedGroups({});
    setEditValues({});
  };

  // 🔧 FIX: nếu groupData không có (undefined) thì lưu thành {} để checkbox có thể toggle
  const toggleGroup = (groupKey: string, groupData: any) => {
    setSelectedGroups((prev) => {
      const updated = { ...prev };
      if (updated[groupKey]) {
        delete updated[groupKey];
      } else {
        updated[groupKey] = groupData ?? {};
      }
      return updated;
    });
  };

  const handleEdit = (group: string, key: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [key]: value },
    }));
  };

  // Render subfields (với cấu trúc động và các nhóm đặc biệt)
  const renderSubfields = (group: string, field: string, value: any) => {
    if (field === "materials_block" && Array.isArray(value)) {
      return (
        <>
          {value.map((block: any, idx: number) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <Input
                placeholder="Material name"
                value={block.name || ""}
                onChange={(e) =>
                  handleEdit(group, `materials_block_${idx}_name`, e.target.value)
                }
              />
              <Input
                placeholder="Percentage"
                value={block.percentage || ""}
                onChange={(e) =>
                  handleEdit(
                    group,
                    `materials_block_${idx}_percentage`,
                    e.target.value
                  )
                }
              />
            </div>
          ))}
        </>
      );
    }

    if (field === "certifications" && Array.isArray(value)) {
  return (
    <>
      {value.map((cert: any, idx: number) => (
        <div
          key={idx}
          style={{ display: "flex", gap: 8, marginBottom: 4 }}
        >
          <Input
            placeholder="Certificate name"
            value={cert.name || ""}
            onChange={(e) =>
              handleEdit(group, `certifications_${idx}_name`, e.target.value)
            }
          />
          <Input
            placeholder="Certificate No"
            value={cert.number || ""}
            onChange={(e) =>
              handleEdit(group, `certifications_${idx}_number`, e.target.value)
            }
          />
          <Input
            placeholder="Issued by"
            value={cert.issued_by || ""}
            onChange={(e) =>
              handleEdit(group, `certifications_${idx}_issued_by`, e.target.value)
            }
          />
        </div>
      ))}
    </>
  );
}


    return (
      <Input
        value={
          Array.isArray(value)
            ? value.join(", ")
            : typeof value === "object"
            ? JSON.stringify(value)
            : String(value || "")
        }
        onChange={(e) => handleEdit(group, field, e.target.value)}
      />
    );
  };

  const renderDefaultFields = (group: string) => {
    const defaultMap: Record<string, { label: string; key: string }[]> = {
      environmental_impact: [
        { label: "CO₂ emissions (kg)", key: "co2" },
        { label: "Water usage (L)", key: "water" },
        { label: "Energy consumption (kWh)", key: "energy" },
      ],
      digital_identity: [
        { label: "QR Code", key: "qr" },
        { label: "DID", key: "did" },
        { label: "IPFS CID", key: "ipfs_cid" },
      ],

      circularity: [
        { label: "Recycled content (%)", key: "recycled_content" },
        { label: "Reusability (%)", key: "reusability" },
        { label: "Waste reduction (%)", key: "waste_reduction" },
      ],
      quantity_info: [
        { label: "Batch number", key: "batch" },
        { label: "Weight (kg)", key: "weight" },
      ],
      cost_info: [
        { label: "Labor cost", key: "labor_cost" },
        { label: "Transport cost", key: "transport_cost" },
      ],
      transport: [
        { label: "Distance (km)", key: "distance" },
        { label: "CO₂ per km", key: "co2_per_km" },
      ],
      documentation: [
        { label: "File name", key: "file" },
        { label: "Issued by", key: "issued_by" },
      ],
      supply_chain: [
        { label: "Tier", key: "tier" },
        { label: "Supplier", key: "supplier" },
        { label: "Updated at", key: "updated_at" },
      ],
    };

    const fields = defaultMap[group];
    if (!fields) return <Text type="secondary">No data</Text>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map((f) => (
          <div
            key={f.key}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Text style={{ flex: "0 0 160px" }}>{f.label}</Text>
            <Input
              placeholder={f.label}
              onChange={(e) => handleEdit(group, f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    );
  };

  const handleApply = () => {
    if (!selectedTemplate) {
      message.warning("Please select a DPP template first");
      return;
    }

    const merged = {
      ...(selectedTemplate.static_data || {}),
      ...(selectedGroups || {}),
      ...(editValues || {}),
    };

    onChange(merged);
    message.success("DPP applied successfully!");
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <DatabaseOutlined />
          <span>
            Digital Product Passport —{" "}
            <Text code>{eventTypeKey?.toUpperCase() || "UNKNOWN"}</Text>
          </span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleApply}
      okText="Apply DPP"
      width={1200}
      destroyOnClose
      bodyStyle={{
        background: "#fff",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        height: "80vh",
      }}
    >
      <Spin spinning={loading} tip="Loading DPP Templates...">
        <Space style={{ marginBottom: 16, width: "100%" }} align="center">
          <Select
            placeholder="Select DPP Template"
            style={{ flex: 1 }}
            onChange={handleSelectTemplate}
            value={selectedTemplate?.id}
            options={(templates || []).map((tpl) => ({
              label: tpl.name,
              value: tpl.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
          <Button icon={<ReloadOutlined />} onClick={fetchTemplates}>
            Refresh
          </Button>
        </Space>

        {selectedTemplate ? (
          <div
            style={{
              display: "flex",
              gap: 20,
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* LEFT COLUMN */}
            <div
              style={{
                flex: 1,
                background: "#fafafa",
                border: "1px solid #eaeaea",
                borderRadius: 10,
                padding: 12,
                overflowY: "auto",
              }}
            >
              <Divider orientation="left" orientationMargin={0}>
                <Text strong>I. Mandatory Fields</Text>
              </Divider>
              {/* không dùng accordion để tránh block click */}
              <Collapse bordered={false} style={{ background: "transparent" }}>
                {requiredGroups.map((group, idx) => {
                  const groupData =
                    group === "environmental_impact"
                      ? selectedTemplate.dynamic_data?.[group]
                      : selectedTemplate.static_data?.[group];

                  return (
                    <Panel
                      key={group}
                      header={
                        <div>
                          <Checkbox
                            checked={!!selectedGroups[group]}
                            onChange={() => toggleGroup(group, groupData)}
                            style={{ marginRight: 8 }}
                          />
                          <Text strong>
                            {idx + 1}. {group.replaceAll("_", " ")}
                          </Text>
                        </div>
                      }
                    >
                      {groupData
                        ? Object.entries(groupData as Record<string, any>).map(
                            ([field, value]) => (
                              <div
                                key={field}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginBottom: 8,
                                }}
                              >
                                <Text style={{ flex: "0 0 160px" }}>{field}</Text>
                                {renderSubfields(group, field, value)}
                              </div>
                            )
                          )
                        : "No data"}
                    </Panel>
                  );
                })}
              </Collapse>
            </div>

            {/* RIGHT COLUMN */}
            <div
              style={{
                flex: 1,
                background: "#fafafa",
                border: "1px solid #eaeaea",
                borderRadius: 10,
                padding: 12,
                overflowY: "auto",
              }}
            >
              <Divider orientation="left" orientationMargin={0}>
                <Text strong>II. Recommended Fields</Text>
              </Divider>
              {/* không dùng accordion để tránh block click */}
              <Collapse bordered={false} style={{ background: "transparent" }}>
                {optionalGroups.map((group, idx) => {
                  const groupData = selectedTemplate.dynamic_data?.[group];
                  const hasData =
                    groupData && Object.keys(groupData || {}).length > 0;
                  return (
                    <Panel
                      key={group}
                      header={
                        <div>
                          <Checkbox
                            checked={!!selectedGroups[group]}
                            onChange={() => toggleGroup(group, groupData)}
                            style={{ marginRight: 8 }}
                          />
                          <Text strong>
                            {idx + 1 + requiredGroups.length}.{" "}
                            {group.replaceAll("_", " ")}
                          </Text>
                        </div>
                      }
                    >
                      {hasData
                        ? Object.entries(groupData as Record<string, any>).map(
                            ([field, value]) => (
                              <div
                                key={field}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginBottom: 8,
                                }}
                              >
                                <Text style={{ flex: "0 0 160px" }}>{field}</Text>
                                {renderSubfields(group, field, value)}
                              </div>
                            )
                          )
                        : renderDefaultFields(group)}
                    </Panel>
                  );
                })}
              </Collapse>
            </div>
          </div>
        ) : (
          <Empty
            description="Select a DPP Template to view structure"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default DPPPanel;
