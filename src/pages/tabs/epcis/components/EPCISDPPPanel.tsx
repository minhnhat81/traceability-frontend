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
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { ReloadOutlined, DatabaseOutlined, InboxOutlined } from "@ant-design/icons";
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

// helper
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
  const [selectedTemplate, setSelectedTemplate] = useState<DppTemplate | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Record<string, any>>({});
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  // ✅ Doc bundle state (ADDED)
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docFiles, setDocFiles] = useState<UploadFile[]>([]);

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
      const data: any = await listDppTemplates();
      if (Array.isArray(data)) setTemplates(data);
      else if (hasItemsArray(data)) setTemplates(data.items);
      else setTemplates([]);
    } catch (err) {
      console.error(err);
      message.error("Failed to load DPP templates");
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
      setDocFiles([]);
    }
  }, [open]);

  const handleSelectTemplate = (id: number) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSelectedTemplate(tpl);
    setSelectedGroups({});
    setEditValues({});
  };

  const toggleGroup = (groupKey: string, groupData: any) => {
    setSelectedGroups((prev) => {
      const updated = { ...prev };
      if (updated[groupKey]) delete updated[groupKey];
      else updated[groupKey] = groupData ?? {};
      return updated;
    });
  };

  const handleEdit = (group: string, key: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [key]: value },
    }));
  };

  // =========================
  // RENDER SUBFIELDS
  // =========================
  const renderSubfields = (group: string, field: string, value: any) => {
    // composition
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
                  handleEdit(group, `materials_block_${idx}_percentage`, e.target.value)
                }
              />
            </div>
          ))}
        </>
      );
    }

    // certifications
    if (field === "certifications" && Array.isArray(value)) {
      return (
        <>
          {value.map((cert: any, idx: number) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
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

    // ✅ DOCUMENTATION (ADDED – KHÔNG PHÁ CODE CŨ)
    if (group === "documentation") {
      return (
        <>
          <Button type="dashed" onClick={() => setDocModalOpen(true)}>
            Upload document bundle
          </Button>

          {Array.isArray(value) && value.length > 0 && (
            <ul style={{ marginTop: 8 }}>
              {value.map((f: any, idx: number) => (
                <li key={idx}>
                  {f.file_name || f.name} ({Math.round((f.size || 0) / 1024)} KB)
                </li>
              ))}
            </ul>
          )}
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
          <div key={f.key} style={{ display: "flex", gap: 8 }}>
            <Text style={{ flex: "0 0 160px" }}>{f.label}</Text>
            <Input onChange={(e) => handleEdit(group, f.key, e.target.value)} />
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
    <>
      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>
              Digital Product Passport —{" "}
              <Text code>{eventTypeKey?.toUpperCase()}</Text>
            </span>
          </Space>
        }
        open={open}
        onCancel={onCancel}
        onOk={handleApply}
        okText="Apply DPP"
        width={1200}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <Space style={{ marginBottom: 16, width: "100%" }}>
            <Select
              placeholder="Select DPP Template"
              style={{ flex: 1 }}
              onChange={handleSelectTemplate}
              value={selectedTemplate?.id}
              options={templates.map((tpl) => ({
                label: tpl.name,
                value: tpl.id,
              }))}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchTemplates}>
              Refresh
            </Button>
          </Space>

          {selectedTemplate ? (
            <Collapse bordered={false}>
              {[...requiredGroups, ...optionalGroups].map((group) => {
                const groupData =
                  selectedTemplate.static_data?.[group] ??
                  selectedTemplate.dynamic_data?.[group];

                return (
                  <Panel
                    key={group}
                    header={
                      <Checkbox
                        checked={!!selectedGroups[group]}
                        onChange={() => toggleGroup(group, groupData)}
                      >
                        {group.replaceAll("_", " ")}
                      </Checkbox>
                    }
                  >
                    {groupData
                      ? Object.entries(groupData).map(([field, value]) => (
                          <div key={field} style={{ marginBottom: 8 }}>
                            <Text style={{ width: 160, display: "inline-block" }}>
                              {field}
                            </Text>
                            {renderSubfields(group, field, value)}
                          </div>
                        ))
                      : renderDefaultFields(group)}
                  </Panel>
                );
              })}
            </Collapse>
          ) : (
            <Empty />
          )}
        </Spin>
      </Modal>

      {/* ✅ DOCUMENT UPLOAD MODAL */}
      <Modal
        title="Upload Document Bundle"
        open={docModalOpen}
        onCancel={() => setDocModalOpen(false)}
        onOk={() => {
          const docs = docFiles.map((f) => ({
            file_name: f.name,
            file_type: f.type,
            size: f.size,
            file: f.originFileObj,
          }));
          setEditValues((prev) => ({ ...prev, documentation: docs }));
          setDocModalOpen(false);
        }}
      >
        <Upload.Dragger
          multiple
          beforeUpload={(file) => {
            const allowed = [
              "application/pdf",
              "image/jpeg",
              "image/png",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            if (!allowed.includes(file.type)) {
              message.error("Only PDF / JPG / PNG / DOCX allowed");
              return Upload.LIST_IGNORE;
            }
            if (file.size / 1024 / 1024 > 10) {
              message.error("Max file size 10MB");
              return Upload.LIST_IGNORE;
            }
            return false;
          }}
          fileList={docFiles}
          onChange={({ fileList }) => setDocFiles(fileList)}
        >
          <InboxOutlined />
          <p>Upload multiple documents</p>
        </Upload.Dragger>
      </Modal>
    </>
  );
};

export default DPPPanel;
