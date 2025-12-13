// src/components/MerkleViewer.tsx
import React, { useMemo } from "react";
import { Card, Descriptions, List, Typography } from "antd";
import { EventItem, DocumentItem } from "../../types/dpp";

const { Text } = Typography;

interface MerkleViewerProps {
  events: EventItem[];
  documents: DocumentItem[];
  rootHash?: string | null;
}

function safeDate(v?: string | null) {
  return v ? new Date(v).toLocaleString() : "-";
}

export default function MerkleViewer({
  events,
  documents,
  rootHash,
}: MerkleViewerProps) {
  const eventItems = useMemo(() => events || [], [events]);
  const docItems = useMemo(() => documents || [], [documents]);

  if (!rootHash && !eventItems.length && !docItems.length) return null;

  return (
    <Card
      title="Merkle Tree (EPCIS + DPP)"
      className="merkle-section"
      bodyStyle={{ paddingTop: 16 }}
    >
      {rootHash && (
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Merkle Root Hash">
            <Text code style={{ fontSize: 12 }}>
              {rootHash}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      )}

      <List
        header="Event leaves (event_hash)"
        size="small"
        className="mt-4"
        bordered
        dataSource={eventItems}
        renderItem={(ev) => (
          <List.Item>
            <div className="w-full text-sm">
              <Text strong>
                {ev.biz_step || ev.event_type || "Event"}{" "}
                {ev.product_code ? `– ${ev.product_code}` : ""}
              </Text>

              <div className="mt-1 space-y-1">
                <div>
                  <b>Event ID:</b> {ev.event_id || "-"}
                </div>
                <div>
                  <b>Event hash:</b>{" "}
                  <Text code className="text-xs">
                    {ev.event_hash
                      ? `${ev.event_hash.slice(0, 12)}…${ev.event_hash.slice(-8)}`
                      : "—"}
                  </Text>
                </div>
                <div>
                  <b>Time:</b> {safeDate(ev.event_time)}
                </div>
                <div>
                  <b>Location:</b> {ev.read_point || ev.biz_location || "—"}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />

      <List
        header="Document leaves (VC hashes)"
        size="small"
        className="mt-4"
        bordered
        dataSource={docItems}
        renderItem={(d) => (
          <List.Item>
            <div className="w-full text-sm">
              <Text strong>{d.file_name}</Text>
              <div className="mt-1 space-y-1">
                <div>
                  <b>VC status:</b> {d.vc_status || "—"}
                </div>
                <div>
                  <b>File hash:</b>{" "}
                  <Text code className="text-xs">
                    {d.file_hash
                      ? `${d.file_hash.slice(0, 12)}…${d.file_hash.slice(-8)}`
                      : "—"}
                  </Text>
                </div>
                <div>
                  <b>VC hash:</b>{" "}
                  <Text code className="text-xs">
                    {d.vc_hash
                      ? `${d.vc_hash.slice(0, 12)}…${d.vc_hash.slice(-8)}`
                      : "—"}
                  </Text>
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
}

