import React, { useMemo, useState } from "react";
import { Card, Tag, Input, Typography, Space, Row, Col } from "antd";

const { Text } = Typography;

export interface GroupPickerProps {
  eventType: string; // key trong mapping (commissioning, transformation,...)
  mapping: Record<string, { required: string[]; optional: string[] }>;
  values: Record<string, any>; // { groupKey: {...fields} }
  onChange: (v: Record<string, any>) => void;
}

const niceLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export const GroupPicker: React.FC<GroupPickerProps> = ({
  eventType,
  mapping,
  values,
  onChange,
}) => {
  const groups = useMemo(() => {
    const m = mapping[eventType];
    if (!m) return [];
    return [...m.required, ...m.optional];
  }, [eventType, mapping]);

  const [active, setActive] = useState<string | null>(groups[0] || null);

  const handleField = (group: string, field: string, val: any) => {
    onChange({
      ...values,
      [group]: {
        ...(values[group] || {}),
        [field]: val,
      },
    });
  };

  return (
    <Row gutter={12}>
      <Col span={11}>
        <Card size="small" style={{ maxHeight: 480, overflow: "auto" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {groups.map((g) => {
              const isReq = mapping[eventType]?.required.includes(g);
              const filled = !!values[g] && Object.keys(values[g]).length > 0;
              return (
                <div
                  key={g}
                  onClick={() => setActive(g)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border:
                      active === g ? "1px solid #1677ff" : "1px solid #eee",
                    padding: 8,
                    borderRadius: 8,
                    cursor: "pointer",
                    background: active === g ? "#f0f6ff" : "white",
                  }}
                >
                  <Text>{niceLabel(g)}</Text>
                  <Tag color={isReq ? "geekblue" : filled ? "green" : "default"}>
                    {isReq ? "Bắt buộc" : filled ? "✓" : "Gợi ý"}
                  </Tag>
                </div>
              );
            })}
          </Space>
        </Card>
      </Col>

      <Col span={13}>
        <Card size="small" style={{ height: 480, overflow: "auto" }}>
          {active ? (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>{niceLabel(active)}</Text>
              {/* Form tối giản: key/value — bạn có thể thay bằng form cụ thể từng nhóm */}
              <Input
                placeholder="Key"
                value={values[active]?.key || ""}
                onChange={(e) => handleField(active, "key", e.target.value)}
              />
              <Input.TextArea
                placeholder="Value / Nội dung (JSON hoặc text)"
                value={values[active]?.value || ""}
                onChange={(e) => handleField(active, "value", e.target.value)}
                autoSize={{ minRows: 5, maxRows: 14 }}
              />
            </Space>
          ) : (
            <Text type="secondary">Chọn một nhóm bên trái để nhập dữ liệu.</Text>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default GroupPicker;
