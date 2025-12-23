import { Collapse, Descriptions, Tag, Typography } from "antd";
import { EventItem } from "../../types/dpp";

const { Panel } = Collapse;
const { Text } = Typography;

const safeDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString() : "-";

function getTierLabel(ev: EventItem) {
  const role = String(
    (ev as any).owner_role ||
    (ev as any).event_owner_role ||
    (ev as any).batch_owner_role ||
    ""
  ).toUpperCase();

  if (role.includes("FARM")) return "🌱 Farm";
  if (role.includes("SUPPLIER")) return "🚚 Supplier";
  if (role.includes("MANUFACTURER")) return "🏭 Manufacturer";
  if (role.includes("BRAND")) return "🏷️ Brand";
  return "📦 Other";
}

export default function ConsumerEventTimeline({
  events,
}: {
  events: EventItem[];
}) {
  if (!events.length) {
    return <Text type="secondary">No traceability events available.</Text>;
  }

  return (
    <Collapse accordion>
      {events.map((ev, idx) => (
        <Panel
          key={idx}
          header={
            <>
              <Tag>{getTierLabel(ev)}</Tag>
              <Text style={{ marginLeft: 8 }}>
                {ev.biz_step || ev.event_type || "EPCIS Event"}
              </Text>
            </>
          }
        >
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Time">
              {safeDate(ev.event_time)}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {ev.biz_location || ev.read_point || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              {ev.action || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Disposition">
              {ev.disposition || "-"}
            </Descriptions.Item>
          </Descriptions>
        </Panel>
      ))}
    </Collapse>
  );
}
