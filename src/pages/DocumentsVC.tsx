import { useState } from "react";
import { Button, message } from "antd";
import { api } from "../api";

export default function DocumentsVC() {
  const [file, setFile] = useState<File | null>(null);

  async function upload() {
    if (!file) return message.warning("No file selected");
    const fd = new FormData();
    fd.append("file", file);
    const r = await api().post("/api/documents/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    message.success("Uploaded: sha256=" + r.data.sha256);
  }

  async function issueVC() {
    const hash = prompt("Enter document sha256 hex");
    if (!hash) return;
    const r = await api().post("/api/vc/issue", {
      subject: "did:example:123",
      type: "DocumentCredential",
      hash_hex: hash,
    });
    alert("VC issued: " + r.data.jws.slice(0, 40) + "...");
  }

  return (
    <div className="card">
      <h3>🧾 Documents & Verifiable Credentials</h3>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Button onClick={upload}>Upload</Button>
      <Button type="primary" onClick={issueVC} style={{ marginLeft: 8 }}>
        Issue VC
      </Button>
    </div>
  );
}
