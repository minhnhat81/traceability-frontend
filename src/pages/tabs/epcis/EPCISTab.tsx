import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Divider,
  Space,
  Spin,
  Typography,
  message,
  Tag,
  Popconfirm,
  Progress,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { api } from "../../../api";

import EPCISTable from "./components/EPCISTable";
import EPCISFormModal from "./components/EPCISFormModal";
import EPCISFinalizeButton from "./components/EPCISFinalizeButton";
import EPCISCloneButton from "./components/EPCISCloneButton";
import { useAuth } from "../../../store/auth";


const { Title, Text } = Typography;

type Props = {
  batchCode: string;
  batchStatus?: string;
};

type EventsMeta = {
  batch_owner_role?: string | null;
  batch_status?: string | null;
  can_create?: boolean | null;
};

export default function EPCISTab({ batchCode, batchStatus }: Props) {
  const auth = useAuth() as any;
  const userRole: string = String(
    auth?.user?.role ?? auth?.role ?? auth?.profile?.role ?? ""
  ).toUpperCase();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [meta, setMeta] = useState<EventsMeta>({});
  type UsageSummary = {
  total: number;
  used: number; // backward compatibility
  remaining: number;
  unit: string;
  used_from_clone?: number;
  used_from_event?: number;
  used_legacy?: number;
  total_used?: number;
};

  const [usage, setUsage] = useState<UsageSummary>({
  total: 0,
  used: 0,
  remaining: 0,
  unit: "",
  used_from_clone: 0,
  used_from_event: 0,
  used_legacy: 0,
  total_used: 0,
});


  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<React.Key[]>([]);

  // ✅ Load EPCIS events
  const fetchEvents = async () => {
    if (!batchCode) return;
    setLoading(true);
    try {
      const res = await api().get("/api/epcis/events", {
        params: { batch_code: batchCode },
      });
      const items = res.data?.items || [];
      const m: EventsMeta = res.data?.meta || {};

      setEvents(items);
      setMeta({
        batch_owner_role: (m.batch_owner_role || items[0]?.owner_role || "")
          .toString()
          .toUpperCase(),
        batch_status: (
          m.batch_status ||
          items[0]?.batch_status ||
          batchStatus ||
          ""
        )
          .toString()
          .toUpperCase(),
        can_create: typeof m.can_create === "boolean" ? m.can_create : null,
      });
    } catch (e) {
      console.error(e);
      message.error("Failed to load EPCIS events");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load tồn kho thực tế
  const fetchUsage = async () => {
    if (!batchCode) return;
    try {
      const res = await api().get(`/api/batches/${batchCode}/usage_summary`);
      setUsage(res.data);
    } catch (err: any) {
      console.error(err);
      message.warning("Không thể tải dữ liệu tồn kho thực tế");
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchCode]);

  // ✅ Điều kiện bật nút Add EPCIS Event
  // ✅ Cập nhật quyền Add EPCIS Event
const canCreate = useMemo(() => {
  const owner = String(meta.batch_owner_role || "").toUpperCase();
  const status = String(meta.batch_status || batchStatus || "").toUpperCase();

  // ✅ Admin, SuperAdmin, TenantAdmin luôn được phép
  if (["SUPERADMIN", "TENANT_ADMIN", "ADMIN"].includes(userRole)) return true;

  // ✅ Cấm nếu batch đã CLOSED
  if (status === "CLOSED") return false;

  // ✅ Cho phép các role sở hữu batch hiện tại (khi chưa ready)
  if (userRole === owner && status !== "READY_FOR_NEXT_LEVEL") return true;

  // ✅ Cho phép FARM và SUPPLIER đều được Add EPCIS Event
  if (["FARM", "SUPPLIER", "MANUFACTURER", "BRAND"].includes(userRole))
    return true;

  return false;
}, [meta.batch_owner_role, meta.batch_status, batchStatus, userRole]);


  const handleEdit = (record: any) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) => api().delete(`/api/epcis/events/${id}`))
      );
      message.success(`Deleted ${selectedIds.length} event(s) successfully`);
      setSelectedIds([]);
      await fetchEvents();
      await fetchUsage();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.detail || "Bulk delete failed");
    }
  };

  if (loading) return <Spin style={{ marginTop: 80 }} />;

  return (
    <div>
      {/* ✅ Thêm hiển thị tồn kho realtime */}
      <Card
  style={{ marginBottom: 16 }}
  title={<Title level={5}>Batch details</Title>}
>
  <Space direction="vertical" style={{ width: "100%" }}>
    <div>
      <Text strong>Total quantity:</Text> {usage.total} {usage.unit}
    </div>

    <div>
      <Text strong>Used (Clone):</Text>{" "}
      <Text>{usage.used_from_clone ?? 0}</Text> {usage.unit}
    </div>

    <div>
      <Text strong>Used (Event):</Text>{" "}
      <Text>{usage.used_from_event ?? 0}</Text> {usage.unit}
    </div>

    <div>
      <Text strong>Total Used:</Text>{" "}
      <Text type="warning">{usage.total_used ?? usage.used ?? 0}</Text> {usage.unit}
    </div>

    <div>
      <Text strong>Remaining:</Text>{" "}
      <Text type="success">{usage.remaining}</Text> {usage.unit}
    </div>

    <Progress
      percent={
        usage.total > 0
          ? Number(((usage.total_used / usage.total) * 100).toFixed(1))
          : 0
      }
      status="active"
      strokeColor={usage.remaining > 0 ? "#52c41a" : "#ff4d4f"}
    />
  </Space>
</Card>


      {/* ✅ Phần EPCIS Capture */}
      <Card
        title={<Title level={5}>EPCIS Capture — Batch {batchCode}</Title>}
        extra={
          <Space>
            <Tag
              color={
                String(meta.batch_status || batchStatus).toUpperCase() ===
                "READY_FOR_NEXT_LEVEL"
                  ? "green"
                  : "blue"
              }
            >
              {String(meta.batch_status || batchStatus || "OPEN").toUpperCase()}
            </Tag>

            {/* ❌ Ẩn nút "Hoàn tất khai báo EPCIS" vì đã có Clone to Next Level */}
{false && (
  <EPCISFinalizeButton
    batchCode={batchCode}
    batchStatus={meta.batch_status || batchStatus}
    tenantId={auth?.user?.tenant_id || auth?.tenant_id || 1}
    onReload={() => {
      fetchEvents();
      fetchUsage();
    }}
    showStatusChip={false}
  />
)}


            {/* ✅ Nút Clone sang tầng kế tiếp */}
            <EPCISCloneButton
              batchCode={batchCode}
              batchStatus={meta.batch_status || batchStatus}
              total={usage.total}
              used={usage.used}
              remaining={usage.remaining}
              unit={usage.unit}
              userRole={userRole}
              onReload={() => {
                fetchUsage(); // cập nhật tồn kho thật
                fetchEvents(); // cập nhật danh sách EPCIS
              }}
            />

            {/* ✅ Nút Add EPCIS Event */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!canCreate}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              Add EPCIS Event
            </Button>

            {selectedIds.length > 0 && (
              <Popconfirm
                title={`Delete ${selectedIds.length} selected event(s)?`}
                onConfirm={handleDeleteSelected}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={selectedIds.length === 0}
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      />

      <Divider />

      <EPCISTable
        events={events}
        batchStatus={meta.batch_status || batchStatus}
        onReload={() => {
          fetchEvents();
          fetchUsage();
        }}
        onEdit={handleEdit}
        onSelectChange={setSelectedIds}
        selectedIds={selectedIds}
      />

      <EPCISFormModal
        open={modalOpen}
        editing={editing}
        batchCode={batchCode}
        batchStatus={meta.batch_status || batchStatus}
        onClose={() => {setModalOpen(false); setEditing(null); }}
        onReload={() => {
          fetchEvents();
          fetchUsage();
        }}
      />
    </div>
  );
}
