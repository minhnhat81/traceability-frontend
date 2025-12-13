import { Typography } from "antd";
const { Title, Paragraph } = Typography;

export default function ProductInfoPage() {
  return (
    <div>
      <Title level={3}>Product Information</Title>
      <Paragraph>Thông tin sản phẩm chi tiết cho người dùng.</Paragraph>
    </div>
  );
}
