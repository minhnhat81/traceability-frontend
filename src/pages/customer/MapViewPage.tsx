import { Typography } from "antd";
const { Title, Paragraph } = Typography;

export default function MapViewPage() {
  return (
    <div>
      <Title level={3}>Map View</Title>
      <Paragraph>Hiển thị lộ trình sản phẩm theo EPCIS events.</Paragraph>
    </div>
  );
}
