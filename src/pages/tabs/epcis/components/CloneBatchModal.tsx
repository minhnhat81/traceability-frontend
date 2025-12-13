import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  InputNumber,
  Typography,
  Progress,
  message,
  Space,
  Divider,
  Tooltip,
} from "antd";
import { ArrowRightOutlined, ReloadOutlined } from "@ant-design/icons";
import { api } from "@/api";

const { Text, Title } = Typography;

export default function CloneBatchModal({ batch, onReload }) {
  const [open, setOpen] = useState(false);
  const [usedQty, setUsedQty] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usageLog, setUsageLog] = useState<any[]>([]);

  // 👉 Fetch usage log để hiển thị chi tiết số lần clone
  const fetchUsageLog = async () => {
    if (!batch?.id) return;
    setRefreshing(true);
    try {
      const res = await api().get(`/api/batches/usage-log/${batch.id}`);
      setUsageLog(res.data.items || []);
    } catch (e) {
      console.warn("Không thể load usage log:", e);
    } finally {
      setRefreshing(false);
    }
  };

  // tự động tải khi mở modal
  useEffect(() => {
    if (open) fetchUsageLog();
  }, [open]);

  const total = batch.quantity || 0;
  const used = batch.used || batch.used_quantity || 0;
  const remaining = total - used;
  const percent = total ? (used / total) * 100 : 0;

  const handleConfirm = async () => {
    if (!usedQty || usedQty <= 0) {
      message.warning("Vui lòng nhập số lượng > 0");
      return;
    }
    if (usedQty > remaining) {
      message.warning("Số lượng vượt quá tồn kho");
      return;
    }

    setLoading(true);
    try {
      const res = await api().post("/api/batches/clone_for_next_level", {
        batch_code: batch.code,
        used_quantity: usedQty,
      });

      message.success(`Tạo lô con thành công (${res.data.new_code})`);
      setUsedQty(null);
      onReload?.();
      fetchUsageLog(); // refresh usage log
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.detail || "Clone thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        icon={<ArrowRightOutlined />}
        type="dashed"
        onClick={() => setOpen(true)}
        disabled={remaining <= 0}
      >
        Clone to Next Level
      </Button>

      <Modal
        title={`Clone batch ${batch.code} sang tầng kế tiếp`}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleConfirm}
        okText="Xác nhận"
        confirmLoading={loading}
        width={520}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* ====== Thông tin tồn kho ====== */}
          <div style={{ textAlign: "center" }}>
            <Title level={5}>Tồn kho hiện tại</Title>
            <Progress percent={percent} showInfo={false} />
            <Text>
              Tổng: <b>{total}</b> {batch.unit}
            </Text>
            <br />
            <Text>
              Đã dùng: <b>{used}</b> {batch.unit}
            </Text>
            <br />
            <Text type="success">
              Còn lại: <b>{remaining}</b> {batch.unit}
            </Text>
          </div>

          {/* ====== Nhập số lượng ====== */}
          <div>
            <Text strong>Nhập số lượng để tạo lô con:</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 6 }}
              min={0.001}
              max={remaining}
              placeholder={`≤ ${remaining} ${batch.unit}`}
              value={usedQty || undefined}
              onChange={(v) => setUsedQty(Number(v))}
            />
          </div>

          {/* ====== Lịch sử clone (usage log) ====== */}
          <Divider style={{ margin: "12px 0" }} />
          <div>
            <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
              <Title level={5} style={{ margin: 0 }}>
                Lịch sử sử dụng / Clone
              </Title>
              <Tooltip title="Tải lại lịch sử">
                <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  onClick={fetchUsageLog}
                  loading={refreshing}
                />
              </Tooltip>
            </Space>
            {usageLog.length === 0 ? (
              <Text type="secondary">Chưa có lần clone nào</Text>
            ) : (
              <ul style={{ marginTop: 8, paddingLeft: 18, maxHeight: 140, overflowY: "auto" }}>
                {usageLog.map((u) => (
                  <li key={u.id}>
                    <Text>
                      <b>{u.child_code}</b> —{" "}
                      <Text type="secondary">
                        {u.used_quantity} {u.unit} ({u.purpose || "Clone"})
                      </Text>{" "}
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(u.created_at).toLocaleString()}
                      </Text>
                    </Text>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Space>
      </Modal>
    </>
  );
}
