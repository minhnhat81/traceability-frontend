import { useEffect, useState } from "react";
import { api } from "../api";
import {
  Table,
  Form,
  Input,
  Button,
  message,
  Modal,
  Select,
  Tag,
  Popconfirm,
  Row,
  Col,
  Card,
} from "antd";
import { useAuth } from "../store/auth";

// ------------------------------
// 🎭 Danh sách role gốc
// ------------------------------
const ROLE_OPTIONS = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "tenant_admin", label: "Tenant Admin" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "supplier", label: "Supplier" },
  { value: "farm", label: "Farm" },
  { value: "brand", label: "Brand" },
  { value: "operator", label: "Operator" },
];

// ------------------------------
// 🔒 Hàm lọc role theo người đăng nhập
// ------------------------------
const getAllowedRoles = (currentRole: string) => {
  switch (currentRole) {
    case "superadmin":
      return ROLE_OPTIONS;
    case "tenant_admin":
      return ROLE_OPTIONS.filter(
        (r) => !["superadmin", "tenant_admin"].includes(r.value)
      );
    case "admin":
      return ROLE_OPTIONS.filter(
        (r) => !["superadmin", "tenant_admin", "admin"].includes(r.value)
      );
    default:
      return [];
  }
};

export default function Users() {
  console.log("✅ Users.tsx (full version with safe role filtering) loaded");

  const { tenant, user } = useAuth(); // ✅ có thể null lúc đầu
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [modalForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  // ✅ Role dropdown mặc định → không bị "No data"
  const [filteredRoles, setFilteredRoles] = useState(ROLE_OPTIONS);

  useEffect(() => {
    if (user?.role) {
      const newRoles = getAllowedRoles(user.role);
      setFilteredRoles(newRoles);
    }
  }, [user?.role]);

  // 📦 Load danh sách user
  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api().get("/api/users");
      setUsers(res.data.items || []);
    } catch (err: any) {
      message.error(err?.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // 🟢 Mở modal tạo/sửa user
  const openModal = (record?: any) => {
    setEditing(record || null);
    modalForm.resetFields();
    modalForm.setFieldsValue(record || { role: "supplier", is_active: true });
    setModalVisible(true);
  };

  // 💾 Lưu user
  const saveModal = async () => {
    const v = await modalForm.validateFields();

    try {
      if (editing) {
        await api().put(`/api/users/${editing.id}`, v);
        message.success("User updated");
      } else {
        await api().post("/api/users", v);
        message.success("User created successfully");
      }
      setModalVisible(false);
      loadUsers();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err.message);
    }
  };

  // 🔒 Modal đổi mật khẩu
  const openPwdModal = (record: any) => {
    setEditing(record);
    setPwdVisible(true);
    pwdForm.resetFields();
  };

  const savePwd = async () => {
    try {
      const v = await pwdForm.validateFields();
      await api().post(`/api/users/${editing.id}/reset-password`, v);
      message.success("Password updated");
      setPwdVisible(false);
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err.message);
    }
  };

  // 🗑️ Xoá user
  const deleteUser = async (id: number) => {
    await api().delete(`/api/users/${id}`);
    message.success("Deleted");
    loadUsers();
  };

  return (
    <div className="container">
      <Row gutter={12}>
        <Col span={24}>
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Users</span>
                {tenant && <Tag color="blue">{tenant.name || "tenant"}</Tag>}
              </div>
            }
          >
            <Button
              type="primary"
              onClick={() => openModal()}
              style={{ marginBottom: 12 }}
              disabled={filteredRoles.length === 0 && !!user?.role} // ✅ chỉ disable nếu role load xong mà không được phép
            >
              + Add User
            </Button>

            <Table
              rowKey="id"
              dataSource={users}
              loading={loading}
              size="small"
              columns={[
                {
                  title: "Action",
                  render: (_: any, row: any) => (
                    <>
                      <Button size="small" onClick={() => openModal(row)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        style={{ marginLeft: 8 }}
                        onClick={() => openPwdModal(row)}
                      >
                        Change Password
                      </Button>
                      <Popconfirm
                        title="Delete user?"
                        onConfirm={() => deleteUser(row.id)}
                      >
                        <Button danger size="small" style={{ marginLeft: 8 }}>
                          Delete
                        </Button>
                      </Popconfirm>
                    </>
                  ),
                },
                { title: "ID", dataIndex: "id", width: 50 },
                { title: "Tenant", dataIndex: "tenant_id", width: 60 },
                { title: "Email", dataIndex: "email" },
                { title: "Username", dataIndex: "username" },
                { title: "Name", dataIndex: "name" },
                { title: "Role", dataIndex: "role" },
                {
                  title: "Status",
                  dataIndex: "is_active",
                  render: (v: boolean) =>
                    v ? (
                      <Tag color="green">active</Tag>
                    ) : (
                      <Tag color="red">inactive</Tag>
                    ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 🧾 Create / Edit Modal */}
      <Modal
        title={editing ? `Edit User: ${editing.email}` : "Create User"}
        open={modalVisible}
        onOk={saveModal}
        onCancel={() => setModalVisible(false)}
        okText="Save"
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Email is required" }]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Username is required" }]}
          >
            <Input placeholder="username" />
          </Form.Item>

          <Form.Item name="name" label="Full Name">
            <Input placeholder="User full name" />
          </Form.Item>

          {/* ✅ Chỉ hiện trường password khi tạo user mới */}
          {!editing && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          )}

          {/* ✅ Dropdown role có dữ liệu mặc định và cập nhật khi user.role load */}
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select
              options={filteredRoles}
              placeholder={
                filteredRoles.length === 0
                  ? "No available roles"
                  : "Select role"
              }
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "Active", value: true },
                { label: "Inactive", value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 🔐 Change Password Modal */}
      <Modal
        title={`Change Password: ${editing?.email}`}
        open={pwdVisible}
        onOk={savePwd}
        onCancel={() => setPwdVisible(false)}
        okText="Update"
      >
        <Form form={pwdForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="New Password"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
