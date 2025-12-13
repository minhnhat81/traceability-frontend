import React, { useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "antd";

export interface EPCISEvent {
  event_id?: string;
  biz_step?: string;
  event_time?: string;
}

interface Props {
  events: EPCISEvent[];
}

export default function EPCISGraph({ events }: Props) {
  const fgRef = useRef<any>();

  if (!events || events.length === 0) {
    return <Card>No EPCIS data available</Card>;
  }

  // Sort by time
  const sorted = [...events].sort((a, b) =>
    (a.event_time || "").localeCompare(b.event_time || "")
  );

  const nodes = sorted.map((ev, idx) => ({
    id: idx,
    label: ev.biz_step || "Event",
    time: ev.event_time || "",
  }));

  const links = sorted.slice(1).map((_, idx) => ({
    source: idx,
    target: idx + 1,
  }));

  // Fit graph into view automatically
  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400);
      }, 500);
    }
  }, [events]);

  return (
    <Card title="EPCIS Flow Graph" className="mt-4">
      <div style={{ height: "500px", width: "100%" }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes, links }}
          nodeAutoColorBy="label"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0}
          nodeLabel={(n: any) => `${n.label}\n${n.time}`}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = `${node.label}`;
            const fontSize = 12 / globalScale;

            ctx.fillStyle = node.color || "#1976D2";
            ctx.beginPath();
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.font = `${fontSize}px Inter`;
            ctx.fillStyle = "#333";
            ctx.fillText(label, node.x + 8, node.y + 4);
          }}
        />
      </div>
    </Card>
  );
}
