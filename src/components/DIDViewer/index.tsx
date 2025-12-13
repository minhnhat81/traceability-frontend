import React, { useState } from "react";
import { Card, Input, Button, Typography } from "antd";

const { Text } = Typography;

interface DIDViewerProps {
  initialDid?: string;
}

export default function DIDViewer({ initialDid }: DIDViewerProps) {
  const [did, setDid] = useState(initialDid || "");
  const [doc, setDoc] = useState<any>(null);

  async function resolve() {
    try {
      const res = await fetch(`https://uniresolver.io/1.0/identifiers/${did}`);
      const json = await res.json();
      setDoc(json);
    } catch (e) {
      console.error("DID resolve failed:", e);
    }
  }

  return (
    <Card title="Decentralized Identifier (DID) Viewer">
      <Input
        value={did}
        onChange={(e) => setDid(e.target.value)}
        placeholder="Enter DID (did:...)"
        style={{ marginBottom: 12 }}
      />

      <Button type="primary" onClick={resolve}>
        Resolve DID
      </Button>

      {doc && (
        <pre
          style={{
            marginTop: 20,
            background: "#111",
            color: "#0f0",
            padding: 12,
            borderRadius: 4,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {JSON.stringify(doc, null, 2)}
        </pre>
      )}
    </Card>
  );
}
