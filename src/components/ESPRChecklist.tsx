import { Card, List, Tag } from "antd";
import { ESPR_CHECKLIST } from "../constants/esprChecklist";

export default function ESPRChecklist({ data }: any) {
  return (
    <Card title="EU ESPR Compliance Checklist">
      <List
        dataSource={ESPR_CHECKLIST}
        renderItem={(item) => {
          const ok = item.check(
            data.dpp_json?.dpp,
            data.blockchain,
            data.documents
          );
          return (
            <List.Item>
              {item.id} – {item.title}{" "}
              <Tag color={ok ? "green" : "red"}>
                {ok ? "Compliant" : "Missing"}
              </Tag>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
