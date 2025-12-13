import { Card, Typography, Space } from "antd";
const { Title, Text } = Typography;

export default function ProductHeader({ product }: any) {
  return (
    <Card
      style={{
        borderRadius: 12,
        padding: 16,
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      <img
        src={product?.image_url || "/no-image.png"}
        alt="product"
        style={{
          width: 110,
          height: 110,
          objectFit: "cover",
          borderRadius: 8,
          background: "#f0f0f0",
        }}
      />

      <Space direction="vertical" size={2}>
        <Title level={4} style={{ margin: 0 }}>
          {product?.name || "Unnamed Product"}
        </Title>
        <Text type="secondary">{product?.brand}</Text>
        {product?.gtin && (
          <Text style={{ fontSize: 12 }}>GTIN: {product.gtin}</Text>
        )}
      </Space>
    </Card>
  );
}
