// src/components/DPPJsonLdViewer.tsx
import React from "react";
import { Card, Descriptions, Tabs, Typography } from "antd";

const { TabPane } = Tabs;
const { Text } = Typography;

interface Props {
  jsonLd: any | null;
}

export default function DPPJsonLdViewer({ jsonLd }: Props) {
  if (!jsonLd) {
    return (
      <Card>
        <Text type="secondary">No JSON-LD generated.</Text>
      </Card>
    );
  }

  const product = jsonLd || {};
  const trace = product.traceability || {};
  const blockchain = trace.blockchain || {};

  return (
    <Card bordered={false}>
      <Tabs defaultActiveKey="fields">
        {/* ====== VIEW 1: FIELDS ====== */}
        <TabPane tab="Structured fields" key="fields">
          <Descriptions title="Product" bordered size="small" column={2}>
            <Descriptions.Item label="Product name">
              {product["gs1:productName"] || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Brand">
              {product["gs1:brandName"] || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="GTIN">
              {product["gs1:gtin"] || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Country of origin">
              {product["gs1:countryOfOriginStatement"] || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Batch / Lot" span={2}>
              {product["gs1:batchOrLotNumber"] || "-"}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title="Blockchain anchor"
            bordered
            size="small"
            column={1}
            style={{ marginTop: 16 }}
          >
            <Descriptions.Item label="Network">
              {blockchain.network || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Tx hash">
              <Text code>{blockchain.txHash || "-"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Root hash">
              <Text code>{blockchain.rootHash || "-"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Block number">
              {blockchain.blockNumber ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="IPFS CID">
              {blockchain.ipfsCid || "-"}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>

        {/* ====== VIEW 2: RAW JSON ====== */}
        <TabPane tab="Raw JSON-LD" key="json">
          <pre
            style={{
              background: "#111",
              color: "#0f0",
              padding: 12,
              borderRadius: 4,
              maxHeight: 400,
              overflow: "auto",
              fontSize: 12,
            }}
          >
            {JSON.stringify(jsonLd, null, 2)}
          </pre>
        </TabPane>
      </Tabs>
    </Card>
  );
}
