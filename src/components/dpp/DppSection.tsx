import React from "react";
import { Collapse } from "antd";

const { Panel } = Collapse;

export default function DppSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapse
      defaultActiveKey={defaultOpen ? ["1"] : []}
      expandIconPosition="end"
      style={{
        background: "transparent",
        border: "none",
      }}
    >
      <Panel
        header={title}
        key="1"
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #f0f0f0",
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        {children}
      </Panel>
    </Collapse>
  );
}
