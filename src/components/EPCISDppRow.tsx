import React from "react";
import { Card, Col, Row, Space, Tag, Typography } from "antd";

const { Text } = Typography;

export default function EPCISDppRow({ ev }: any) {
  const dpp = ev?.ilmd?.dpp || null;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: "1px solid #e5e5e5",
      }}
    >
      <Row gutter={[16, 16]}>
        {/* ======================= LEFT COLUMN: EPCIS ======================= */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text strong style={{ fontSize: 15 }}>
              EPCIS Event — {ev.event_type}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <b>Event Time:</b> {ev.event_time}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <b>BizStep:</b> {ev.biz_step}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <b>Disposition:</b> {ev.disposition}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <b>ReadPoint:</b> {ev.read_point}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <b>BizLocation:</b> {ev.biz_location}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <b>Action:</b> {ev.action}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <b>Event ID:</b> {ev.event_id}
            </Text>

            {ev.epc_list?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text strong>EPC List:</Text>
                <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                  {ev.epc_list.map((x: string, i: number) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Space>
        </Col>

        {/* ======================= RIGHT COLUMN: DPP ======================= */}
        <Col xs={24} md={12}>
          <Card
            size="small"
            style={{
              background: "#fafafa",
              borderRadius: 6,
              minHeight: "100%",
            }}
          >
            {!dpp ? (
              <Text type="secondary">No DPP attached</Text>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }} size={4}>
                <Text strong style={{ fontSize: 15 }}>
                  DPP Details
                </Text>

                {/* Product */}
                <Text>
                  <b>Product:</b>{" "}
                  {dpp?.product_description?.name || "-"}
                </Text>

                {/* Digital Identity */}
                {dpp?.digital_identity && (
                  <>
                    <Text>
                      <b>QR:</b> {dpp.digital_identity.qr}
                    </Text>
                    <Text>
                      <b>DID:</b> {dpp.digital_identity.did}
                    </Text>
                    <Text>
                      <b>CID:</b> {dpp.digital_identity.ipfs_cid}
                    </Text>
                  </>
                )}

                {/* Composition */}
                {dpp?.composition?.materials && (
                  <Text>
                    <b>Materials:</b>{" "}
                    {dpp.composition.materials.join(", ")}
                  </Text>
                )}

                {/* Use */}
                {dpp?.use_phase?.instructions && (
                  <Text>
                    <b>Use:</b> {dpp.use_phase.instructions}
                  </Text>
                )}

                {/* Recycle */}
                {dpp?.end_of_life?.recycle_guideline && (
                  <Text>
                    <b>Recycle:</b> {dpp.end_of_life.recycle_guideline}
                  </Text>
                )}

                {/* Social impact */}
                {dpp?.social_impact?.factory && (
                  <Text>
                    <b>Factory:</b> {dpp.social_impact.factory}
                  </Text>
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
