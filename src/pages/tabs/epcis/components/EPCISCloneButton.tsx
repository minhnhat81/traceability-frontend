import React, { useState } from "react";
import {
  Button,
  Modal,
  Input,
  InputNumber,
  Typography,
  message,
  Space,
  Progress,
  Divider,
  Card,
  Result,
} from "antd";
import { ArrowRightOutlined, WarningOutlined } from "@ant-design/icons";
import { api } from "@/api";

const { Text, Title } = Typography;

export type EPCISCloneButtonProps = {
  batchCode: string;
  batchStatus?: string;
  total?: number;
  used?: number;
  remaining?: number;
  unit?: string;
  userRole?: string;
  onReload?: () => void;
};

const EPCISCloneButton: React.FC<EPCISCloneButtonProps> = ({
  batchCode,
  batchStatus,
  total = 0,
  used = 0,
  remaining = 0,
  unit = "",
  userRole = "",
  onReload,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedQty, setUsedQty] = useState<number | null>(null);
  const [convertedUnit, setConvertedUnit] = useState<string>("");
  const [convertedRate, setConvertedRate] = useState<number | null>(null);

  const role = String(userRole || "").toUpperCase();
  const status = String(batchStatus || "").toUpperCase();

  // ✅ Cho phép clone nếu batch READY hoặc role FARM/SUPPLIER đang ACTIVE

const canClone = remaining > 0 && status !== "CLOSED";
const disabled = !canClone || loading;

  const isFullTransfer = ["FARM", "SUPPLIER"].includes(role);
  const isCanSplit = ["MANUFACTURER", "BRAND"].includes(role);

  const handleOk = async () => {
    let qty = usedQty;

    if (isFullTransfer) {
      qty = remaining;
    }

    if (!qty || qty <= 0) {
      message.warning("Vui lòng nhập số lượng sử dụng hợp lệ (> 0).");
      return;
    }
    if (qty > remaining) {
      message.warning("Số lượng sử dụng không được vượt quá tồn còn lại của lô cha.");
      return;
    }

    setLoading(true);
    try {
      await api().post("/api/batches/clone_for_next_level", {
        batch_code: batchCode,
        used_quantity: qty,
        converted_unit: convertedUnit || undefined,
        converted_rate: convertedRate || undefined,
      });
      message.success("Đã clone sang tầng kế tiếp thành công.");
      setOpen(false);
      setUsedQty(null);
      setConvertedUnit("");
      setConvertedRate(null);
      onReload?.();
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.detail || "Clone batch thất bại");
    } finally {
      setLoading(false);
    }
  };

  const OutOfStockBlock = (
    <Result
      status="warning"
      icon={<WarningOutlined style={{ color: "#faad14" }} />}
      title="Lô cha đã được sử dụng hết"
      subTitle="Không thể tạo thêm lô con vì tồn kho = 0."
    />
  );

  return (
    <>
      <Button
        type="dashed"
        icon={<ArrowRightOutlined />}
        disabled={disabled}
        onClick={() => {
          setOpen(true);
          if (isFullTransfer) setUsedQty(remaining);
        }}
      >
        Clone to Next Level
      </Button>

      <Modal
        title={`Clone batch ${batchCode} sang tầng kế tiếp`}
        open={open}
        onCancel={() => {
          setOpen(false);
          setUsedQty(null);
          setConvertedUnit("");
          setConvertedRate(null);
        }}
        onOk={handleOk}
        okText="Xác nhận"
        confirmLoading={loading}
        destroyOnClose
        width={560}
      >
        <Card bordered style={{ background: "#fafafa", borderRadius: 12 }}>
          <Title level={5} style={{ textAlign: "center", marginBottom: 8 }}>
            Tồn kho hiện tại
          </Title>
          <Progress
            percent={total ? (used / total) * 100 : 0}
            showInfo={false}
            strokeColor="#52c41a"
          />
          <Space direction="vertical" size={4} style={{ width: "100%", textAlign: "center" }}>
            <Text>
              Tổng: <b>{total}</b> {unit}
            </Text>
            <Text>
              Đã dùng: <b>{used}</b> {unit}
            </Text>
            <Text type="success">
              Còn lại: <b>{remaining}</b> {unit}
            </Text>
          </Space>
        </Card>

        <Divider />

        {remaining <= 0 ? (
          OutOfStockBlock
        ) : isFullTransfer ? (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Text strong>
              Vai trò <b>{role}</b> chỉ cho phép chuyển <b>toàn bộ</b> phần còn lại sang tầng kế tiếp.
            </Text>
            <Text>
              Sẽ chuyển toàn bộ <b>{remaining}</b> {unit}.
            </Text>
          </Space>
        ) : (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Text strong>Nhập số lượng để tạo lô con:</Text>
            <InputNumber
              style={{ width: "100%" }}
              min={0.001}
              max={remaining}
              step={0.001}
              placeholder={`≤ ${remaining} ${unit}`}
              onChange={(v) => setUsedQty(Number(v))}
            />
            <Text type="secondary">Đơn vị: {unit}</Text>

            {role === "MANUFACTURER" && (
              <>
                <Divider />
                <Text strong>Chuyển đổi đơn vị (nếu có):</Text>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Input
                    placeholder="Đơn vị mới, ví dụ: chiếc"
                    value={convertedUnit}
                    onChange={(e) => setConvertedUnit(e.target.value)}
                  />
                  <InputNumber
                    min={0.000001}
                    step={0.000001}
                    style={{ width: "100%" }}
                    placeholder="Tỷ lệ quy đổi (vd: 0.4 = 1kg → 0.4 chiếc)"
                    value={convertedRate || undefined}
                    onChange={(v) => setConvertedRate(Number(v))}
                  />
                  <Text type="secondary">
                    Nếu không nhập, hệ thống giữ nguyên đơn vị <b>{unit}</b>.
                  </Text>
                </Space>
              </>
            )}
          </Space>
        )}
      </Modal>
    </>
  );
};

export default EPCISCloneButton;
