import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { UploadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { api } from "../../api";

const { Text } = Typography;

/* ============================
   Types
============================ */
type DocItem = {
  file_hash: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  path: string;
  vc_hash_hex?: string | null;
  vc_status?: "DRAFT" | "SIGNED" | "VERIFIED";
};

/* ============================
   Component
============================ */
export default function DocumentsTab({
  batchCode,
  onRefreshDocs,
}: {
  batchCode?: string;
  onRefreshDocs?: () => void;
}) {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "SIGNED" | "VERIFIED">(
    "ALL"
  );

  /* ============================
     Load documents
  ============================ */
  async function load() {
    if (!batchCode) return;
    setLoading(true);
    try {
      const r = await api().get("/api/documents", {
        params: { page: 1, size: 50 },
      });

      const docs: DocItem[] =
        r.data?.items?.map((d: any) => ({
          ...d,
          vc_status: d.vc_hash_hex ? "SIGNED" : "DRAFT",
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

  /* ============================
     Filter
  ============================ */
  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((d) => d.vc_status === filter);
  }, [items, filter]);

  /* ============================
     Issue VC (EU DPP)
  ============================ */
  async function issueVC(row: DocItem) {
    Modal.confirm({
      title: "Issue Verifiable Credential?",
      content:
        "This will cryptographically sign the document hash and make it immutable.",
      onOk: async () => {
        try {
          await api().post("/api/vc/issue", {
            subject: `did:example:batch:${batchCode}`,
            type: "DocumentCredential",
            hash_hex: row.file_hash,
          });
          message.success("VC issued");
          load();
          onRefreshDocs?.();
        } catch (e: any) {
          message.error(e?.response?.data?.detail || "Issue VC failed");
        }
      },
    });
  }

  /* ============================
     Upload
  ============================ */
  async function customUpload({ file }: any) {
    if (!batchCode) return message.warning("Select batch first");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
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

  /* ============================
     Table columns
  ============================ */
  const columns: ColumnsType<DocItem> = [
    {
      title: "Document",
      dataIndex: "file_name",
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Hash",
      dataIndex: "file_hash",
      render: (v) => <Text code>{v.slice(0, 12)}…</Text>,
    },
    {
      title: "Type",
      dataIndex: "file_type",
    },
    {
      title: "Size",
      dataIndex: "file_size",
      render: (v) => `${(v / 1024).toFixed(1)} KB`,
    },
    {
      title: "Status",
      dataIndex: "vc_status",
      render: (v) => {
        if (v === "VERIFIED") return <Tag color="green">VERIFIED</Tag>;
        if (v === "SIGNED") return <Tag color="blue">SIGNED</Tag>;
        return <Tag color="gold">DRAFT</Tag>;
      },
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          {r.vc_status === "DRAFT" && (
            <Button
              size="small"
              icon={<SafetyCertificateOutlined />}
              onClick={() => issueVC(r)}
            >
              Issue VC
            </Button>
          )}

          {r.vc_status !== "DRAFT" && (
            <Button size="small" disabled>
              VC Linked
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /* ============================
     Render
  ============================ */
  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Space wrap>
        <Select
          value={filter}
          onChange={(v) => setFilter(v)}
          options={[
            { value: "ALL", label: "All" },
            { value: "DRAFT", label: "Draft" },
            { value: "SIGNED", label: "Signed" },
            { value: "VERIFIED", label: "Verified" },
          ]}
          style={{ width: 160 }}
        />

        <Upload customRequest={customUpload} showUploadList={false}>
          <Button loading={uploading} icon={<UploadOutlined />}>
            Upload document
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
