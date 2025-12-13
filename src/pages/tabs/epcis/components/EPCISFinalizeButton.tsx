import { useState } from "react";
import { Button, Modal, message, Typography, Tag } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { api } from "@/api";

const { Paragraph, Text } = Typography;

interface FinalizeButtonProps {
  batchCode: string;
  batchStatus?: string; // "OPEN" | "CLOSED" | "READY_FOR_NEXT_LEVEL"
  tenantId: number;
  onReload?: () => void;
  showStatusChip?: boolean; // ✅ mới thêm
}

/**
 * ✅ FinalizeButton — nút xác nhận hoàn tất khai báo EPCIS cho batch
 * Khi người dùng nhấn xác nhận:
 *   - Gửi POST /api/batches/finalize hoặc PUT /api/batches/:id/status=READY_FOR_NEXT_LEVEL
 *   - Gắn trạng thái batch thành “READY_FOR_NEXT_LEVEL”
 *   - Các cấp tiếp theo (Supplier, Manufacturer, Brand) mới nhìn thấy batch này.
 */
export default function FinalizeButton({
  batchCode,
  batchStatus,
  tenantId,
  onReload,
  showStatusChip = true, // ✅ mặc định vẫn hiển thị chip nếu không cấu hình
}: FinalizeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleFinalize = async () => {
    Modal.confirm({
      title: "Xác nhận hoàn tất khai báo EPCIS?",
      icon: <ExclamationCircleOutlined />,
      content: (
        <Paragraph>
          Sau khi xác nhận, batch <Text strong>{batchCode}</Text> sẽ được đánh dấu{" "}
          <Tag color="green">READY_FOR_NEXT_LEVEL</Tag> và không thể sửa đổi các sự kiện EPCIS nữa.
          <br />
          Supplier hoặc Manufacturer ở cấp kế tiếp mới có thể thấy và tiếp tục khai báo EPCIS.
        </Paragraph>
      ),
      okText: "Xác nhận hoàn tất",
      cancelText: "Huỷ",
      onOk: async () => {
        setLoading(true);
        try {
          await api().post(`/api/batches/finalize`, {
            batch_code: batchCode,
            tenant_id: tenantId,
          });
          message.success("Batch đã được đánh dấu READY_FOR_NEXT_LEVEL");
          if (onReload) onReload();
        } catch (e: any) {
          console.error(e);
          message.error(e?.response?.data?.detail || "Finalize batch thất bại");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 🟢 Hiển thị trạng thái
  const renderStatus = () => {
    if (!showStatusChip) return null; // ✅ nếu tắt thì không render Tag
    if (batchStatus === "READY_FOR_NEXT_LEVEL")
      return <Tag color="green">READY_FOR_NEXT_LEVEL</Tag>;
    if (batchStatus === "CLOSED") return <Tag color="red">CLOSED</Tag>;
    return <Tag color="blue">OPEN</Tag>;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {renderStatus()}
      {batchStatus !== "READY_FOR_NEXT_LEVEL" && batchStatus !== "CLOSED" && (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleFinalize}
          loading={loading}
        >
          Hoàn tất khai báo EPCIS
        </Button>
      )}
    </div>
  );
}
