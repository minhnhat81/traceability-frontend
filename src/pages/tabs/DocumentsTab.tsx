import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { UploadOutlined } from "@ant-design/icons";
import { api } from "../../api";

type DocItem = {
  id?: number;
  file_hash: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  path: string;
  doc_bundle_id?: string;
  vc_hash_hex?: string | null;
  vc_status?: "DRAFT" | "SIGNED" | "VERIFIED";
};

export default function DocumentsTab({
  batchCode,
  onRefreshDocs,
}: {
  batchCode?: string;
  onRefreshDocs?: () => void;
}) {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "VERIFIED">("ALL");
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((x) =>
      filter === "VERIFIED"
        ? x.vc_status === "VERIFIED" || x.vc_hash_hex
        : !x.vc_hash_hex
    );
  }, [items, filter]);

  async function load() {
    if (!batchCode) return;
    setLoading(true);
    try {
      // ⚠️ API gợi ý: bạn có thể filter theo batch_code ở server
      // /api/documents?batch_code=...
      const r = await api().get("/api/documents", { params: { page: 1, size: 50 } });
      const docs: DocItem[] =
        r.data?.items?.map((d: any) => ({
          ...d,
          vc_status: d.vc_hash_hex ? "VERIFIED" : "DRAFT",
        })) || [];
      setItems(docs);
    } catch (e: any) {
      message.error(e?.response?.data?.detail || "Load documents failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [batchCode]);

  const columns: ColumnsType<DocItem> = [
    { title: "File Name", dataIndex: "file_name", key: "name" },
    {
      title: "Hash",
      dataIndex: "file_hash",
      render: (v) => <code>{v.slice(0, 10)}…</code>,
    },
    { title: "Type", dataIndex: "file_type" },
    {
      title: "Size",
      dataIndex: "file_size",
      render: (v) => `${(v / 1024).toFixed(1)} KB`,
    },
    { title: "Bundle", dataIndex: "doc_bundle_id" },
    {
      title: "VC",
      dataIndex: "vc_hash_hex",
      render: (v) =>
        v ? <Tag color="green">VERIFIED</Tag> : <Tag color="gold">DRAFT</Tag>,
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          {!r.vc_hash_hex && (
            <Button size="small" onClick={() => signVC(r)}>
              Sign VC
            </Button>
          )}
          <Button size="small" danger disabled={!!r.vc_hash_hex || !!r.doc_bundle_id} onClick={() => remove(r)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  async function signVC(row: DocItem) {
    try {
      // gợi ý: API issue VC theo hash
      await api().post("/api/vc/issue", {
        subject: `did:example:batch:${batchCode}`,
        type: "DocumentCredential",
        hash_hex: row.file_hash,
      });
      message.success("VC signed");
      load();
      onRefreshDocs && onRefreshDocs();
    } catch (e: any) {
      message.error(e?.response?.data?.detail || "Sign VC failed");
    }
  }

  async function remove(row: DocItem) {
    Modal.confirm({
      title: "Delete this document?",
      onOk: async () => {
        try {
          // bạn có thể tạo endpoint DELETE /api/documents/{hash}
          await api().delete(`/api/documents/${row.file_hash}`);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.response?.data?.detail || "Delete failed");
        }
      },
    });
  }

  async function customUpload({ file }: any) {
    if (!batchCode) return message.warning("Select batch first");
    setUploading(true);
    try {
      const fd = new FormData();
      // Backend của bạn dùng `files` (list) → thêm 1 phần tử
      fd.append("files", file);
      // Có thể đính kèm batchCode trong query/headers nếu muốn
      await api().post("/api/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Uploaded");
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Space wrap>
        <Select
          value={filter}
          onChange={(v) => setFilter(v)}
          options={[
            { value: "ALL", label: "All" },
            { value: "DRAFT", label: "Draft" },
            { value: "VERIFIED", label: "Verified" },
          ]}
          style={{ width: 160 }}
        />
        <Upload customRequest={customUpload} showUploadList={false} multiple>
          <Button loading={uploading} icon={<UploadOutlined />}>
            Upload documents
          </Button>
        </Upload>
      </Space>

      <Table
        rowKey={(r) => r.file_hash}
        loading={loading}
        dataSource={filtered}
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </Space>
  );
}
