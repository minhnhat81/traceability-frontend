import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, message } from "antd";
import { getFarms, deleteFarm } from "@/services/farmService";

/* ================= FIX TYPE FARM FORM ================= */
type FarmFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingFarm: any;
};

// Mock FarmForm để build không lỗi
const FarmForm: React.FC<FarmFormProps> = () => null;
/* ===================================================== */

const FarmList = () => {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);
  const [openForm, setOpenForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getFarms();
      setFarms(data);
    } catch {
      message.error("Không thể tải danh sách farm");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    await deleteFarm(id);
    message.success("Đã xoá farm");
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Quản lý Farm</h2>
        <Button
          type="primary"
          onClick={() => {
            setEditingFarm(null);
            setOpenForm(true);
          }}
        >
          + Tạo Farm
        </Button>
      </div>

      <Table
        dataSource={farms}
        rowKey="id"
        loading={loading}
        columns={[
          { title: "Tên Farm", dataIndex: "name" },
          { title: "Mã", dataIndex: "code" },
          { title: "Loại", dataIndex: "farm_type" },
          { title: "Trạng thái", dataIndex: "status" },
          {
            title: "Thao tác",
            render: (_, record: any) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setEditingFarm(record);
                    setOpenForm(true);
                  }}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xoá farm này?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button size="small" danger>
                    Xoá
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      {openForm && (
        <FarmForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSuccess={fetchData}
          editingFarm={editingFarm}
        />
      )}
    </div>
  );
};

export default FarmList;
