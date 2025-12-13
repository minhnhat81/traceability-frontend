import { Table, Space, Tooltip, Button, Popconfirm, message } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api } from "@/api";

type Props = {
  events: any[];
  batchStatus?: string;
  onReload: () => void;
  onEdit: (record: any) => void;
  // ✅ Thêm mới:
  onSelectChange?: (selectedIds: React.Key[]) => void;
  selectedIds?: React.Key[];
};

export default function EPCISTable({
  events,
  batchStatus,
  onReload,
  onEdit,
  onSelectChange,
  selectedIds = [],
}: Props) {
  const normalizedStatus = String(batchStatus || "").toUpperCase();
  const batchLocked = normalizedStatus === "CLOSED";

  const handleDelete = async (eventId: string) => {
  try {
    await api().delete(`/api/epcis/events/${eventId}`);
    message.success("Deleted successfully");

    // ✅ Gọi lại reload để cập nhật danh sách event + usage summary
    await onReload?.();
  } catch (err: any) {
    console.error(err);
    message.error(err?.response?.data?.detail || "Delete failed");
  }
  };


  // ✅ Cấu hình checkbox chọn hàng
  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: (keys: React.Key[]) => {
      onSelectChange?.(keys);
    },
    getCheckboxProps: (record: any) => ({
      disabled:
        batchLocked ||
        record?.editable === false ||
        record?.deletable === false,
    }),
  };

  return (
    <Table
      rowKey={(r) => r.event_id}
      dataSource={events}
      pagination={{ pageSize: 5 }}
      bordered
      size="middle"
      rowSelection={rowSelection} // ✅ thêm vào đây
      columns={[
        { title: "Owner", dataIndex: "owner_role" },
        { title: "BizStep", dataIndex: "biz_step" },
        { title: "Disposition", dataIndex: "disposition" },
        { title: "Doc Bundle", dataIndex: "doc_bundle_id" },
        {
          title: "Created Time",
          dataIndex: "created_at",
          render: (t: string) => (t ? dayjs(t).format("YYYY-MM-DD HH:mm") : "—"),
        },
        {
          title: "Action",
          align: "center",
          render: (_: any, record: any) => {
            const eventLocked =
              batchLocked ||
              record?.editable === false ||
              record?.deletable === false;

            const tooltip = eventLocked
              ? "You cannot edit or delete this event"
              : "Edit or delete event";

            return (
              <Space>
                <Tooltip title="View details">
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => onEdit({ ...record, viewOnly: true })}
                  />
                </Tooltip>

                <Tooltip title={tooltip}>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    disabled={eventLocked}
                    onClick={() => onEdit(record)}
                  />
                </Tooltip>

                <Tooltip title={tooltip}>
                  <Popconfirm
                    title="Delete this event?"
                    okText="Delete"
                    cancelText="Cancel"
                    disabled={eventLocked}
                    onConfirm={() => handleDelete(record.event_id)}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={eventLocked}
                    />
                  </Popconfirm>
                </Tooltip>
              </Space>
            );
          },
        },
      ]}
    />
  );
}
