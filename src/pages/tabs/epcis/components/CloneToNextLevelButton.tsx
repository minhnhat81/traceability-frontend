import { useState } from "react";
import { Button, Modal, InputNumber, message, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { api } from "@/api";

const { Paragraph, Text } = Typography;

export default function CloneToNextLevelButton({ batchCode, tenantId, batchStatus, onReload }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedQty, setUsedQty] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!usedQty || usedQty <= 0) {
      message.warning("Vui lòng nhập số lượng hợp lệ!");
      return;
    }
    setLoading(true);
    try {
      const res = await api().post("/api/batches/clone_for_next_level", {
        batch_code: batchCode,
        tenant_id: tenantId,
        used_quantity: usedQty,
      });
      message.success(`Đã tạo batch mới thành công (${usedQty} đơn vị sử dụng).`);
      setVisible(false);
      if (onReload) onReload();
    } catch (e: any) {
      message.error(e?.response?.data?.detail || "Lỗi clone batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {batchStatus === "READY_FOR_NEXT_LEVEL" && (
        <Button
          type="dashed"
          icon={<ArrowRightOutlined />}
          onClick={() => setVisible(true)}
        >
          Clone to Next Level
        </Button>
      )}

      <Modal
        title={`Clone batch ${batchCode} sang tầng kế tiếp`}
        open={visible}
        onCancel={() => setVisible(false)}
        onOk={handleSubmit}
        okText="Xác nhận"
        confirmLoading={loading}
      >
        <Paragraph>
          Nhập số lượng nguyên liệu cần sử dụng từ batch <Text strong>{batchCode}</Text>:
        </Paragraph>
        <InputNumber
          min={0.001}
          style={{ width: "100%" }}
          placeholder="Nhập số lượng sử dụng (vd: 500)"
          onChange={(v) => setUsedQty(Number(v))}
        />
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          Số lượng này sẽ được trừ khỏi tồn kho batch cha.
        </Paragraph>
      </Modal>
    </>
  );
}
