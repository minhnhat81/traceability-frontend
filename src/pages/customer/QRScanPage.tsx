import { Typography } from "antd";
const { Title, Paragraph } = Typography;

export default function QRScanPage() {
  return (
    <div>
      <Title level={3}>QR Scan</Title>
      <Paragraph>Người dùng quét QR để truy cập DPP Landing Page.</Paragraph>
    </div>
  );
}
