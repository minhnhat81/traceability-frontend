import { QRCodeCanvas } from "qrcode.react";
import { Card, Typography, Button } from "antd";

const { Text, Title } = Typography;

interface Props {
  batchCode: string;
  productName?: string;
  brandName?: string;
  // base URL của landing page, ví dụ: https://trace.yourdomain.com/dpp
  baseUrl?: string;
}

export default function DppQrLabel({
  batchCode,
  productName,
  brandName,
  baseUrl,
}: Props) {
  const url =
    baseUrl ||
    `${window.location.origin}/dpp/${encodeURIComponent(batchCode)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Label card – sẽ in ra khi print */}
      <Card
        className="dpp-print-label"
        style={{
          width: 260,
          textAlign: "center",
          padding: 12,
          borderRadius: 8,
        }}
      >
        {brandName && (
          <Title level={5} style={{ marginBottom: 4 }}>
            {brandName}
          </Title>
        )}
        <Text strong>
          {productName || "Digital Product Passport"}
        </Text>
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <QRCodeCanvas value={url} size={180} />
        </div>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Scan to view product passport
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 10 }}>
          Batch: {batchCode}
        </Text>
      </Card>

      {/* Nút print chỉ hiển thị trên màn hình */}
      <div style={{ marginTop: 12 }} className="dpp-print-actions">
        <Button onClick={handlePrint}>Print Label</Button>
      </div>

      {/* Gợi ý CSS (bạn thêm vào global CSS của project) */}
      {/*
        @media print {
          body * {
            visibility: hidden;
          }
          .dpp-print-label, .dpp-print-label * {
            visibility: visible;
          }
          .dpp-print-label {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
          }
          .dpp-print-actions {
            display: none !important;
          }
        }
      */}
    </div>
  );
}
