import React from "react";
import { Card, Space, Tag, Typography, Divider } from "antd";
import { EventItem } from "../../types/dpp";

const { Text } = Typography;

/* =========================
   Helpers
========================= */

const safeDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString() : "-";

/** Lấy DPP gắn với 1 EPCIS event */
const getEventDpp = (ev: any) =>
  ev?.ilmd?.dpp ||
  ev?.dpp ||
  ev?.extensions?.dpp ||
  null;

/** Xác định tier */
const getTier = (ev: any) => {
  const role = String(
    ev.owner_role ||
      ev.event_owner_role ||
      ev.batch_owner_role ||
      ""
  ).toUpperCase();

  if (role.includes("FARM")) return { key: "FARM", label: "Farm", color: "green" };
  if (role.includes("SUPPLIER")) return { key: "SUPPLIER", label: "Supplier", color: "blue" };
  if (role.includes("MANUFACTURER"))
    return { key: "MANUFACTURER", label: "Manufacturer", color: "orange" };
  if (role.includes("BRAND")) return { key: "BRAND", label: "Brand", color: "purple" };

  return { key: "OTHER", label: "Other", color: "default" };
};

/* =========================
   Consumer DPP summary
========================= */

function ConsumerDppSummary({ dpp }: { dpp: any }) {
  if (!dpp) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        No DPP attached to this event
      </Text>
    );
  }

  return (
    <div style={{ fontSize: 12, lineHeight: 1.45 }}>
      {dpp.product_description?.name && (
        <div>
          <b>Product:</b> {dpp.product_description.name}
        </div>
      )}

      {dpp.composition?.materials && (
        <div>
          <b>Materials:</b>{" "}
          {Array.isArray(dpp.composition.materials)
            ? dpp.composition.materials.join(", ")
            : dpp.composition.materials}
        </div>
      )}

      {dpp.environmental_impact && (
        <div>
          <b>Environmental impact:</b>{" "}
          {[
            dpp.environmental_impact.co2 &&
              `CO₂ ${dpp.environmental_impact.co2}`,
            dpp.environmental_impact.water &&
              `Water ${dpp.environmental_impact.water}`,
            dpp.environmental_impact.energy &&
              `Energy ${dpp.environmental_impact.energy}`,
          ]
            .filter(Boolean)
            .join(" | ")}
        </div>
      )}

      {dpp.social_impact?.certifications?.length > 0 && (
        <div>
          <b>Certifications:</b>{" "}
          {dpp.social_impact.certifications
            .map((c: any) => c.name)
            .filter(Boolean)
            .join(", ")}
        </div>
      )}

      {dpp.end_of_life?.recycle_guideline && (
        <div>
          <b>End of life:</b> {dpp.end_of_life.recycle_guideline}
        </div>
      )}
    </div>
  );
}

/* =========================
   Main component
========================= */

export default function ConsumerEventTimeline({
  events,
}: {
  events: EventItem[];
}) {
  if (!events || !events.length) {
    return (
      <Text type="secondary">
        No supply chain events available.
      </Text>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {events.map((ev, index) => {
        const tier = getTier(ev);
        const dpp = getEventDpp(ev);

        return (
          <Card
            key={ev.event_id || index}
            size="small"
            style={{ borderRadius: 12 }}
          >
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              {/* Header */}
              <Space wrap>
                <Tag color={tier.color}>{tier.label}</Tag>
                <Text strong>{ev.biz_step || ev.event_type || "Event"}</Text>
              </Space>

              <Text type="secondary" style={{ fontSize: 12 }}>
                {safeDate(ev.event_time)}
              </Text>

              <Divider style={{ margin: "6px 0" }} />

              {/* DPP */}
              <ConsumerDppSummary dpp={dpp} />
            </Space>
          </Card>
        );
      })}
    </Space>
  );
}
