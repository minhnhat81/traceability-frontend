import React from "react";
import { Card, Typography, Divider } from "antd";
import KeyValueTable from "../KeyValueTable";

const { Title } = Typography;

export default function EPCISViewer({ event }: any) {
  if (!event) return null;

  const mainFields = {
    id: event.id,
    event_id: event.event_id,
    type: event.event_type,
    action: event.action,
    product_code: event.product_code,
    biz_step: event.biz_step,
    disposition: event.disposition,
    read_point: event.read_point,
    biz_location: event.biz_location,
    event_time: event.event_time,
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <Title level={4}>EPCIS Event Details</Title>

      <Divider>General</Divider>
      <KeyValueTable data={mainFields} />

      {event.epc_list && (
        <>
          <Divider>EPC List</Divider>
          <KeyValueTable data={{ EPCs: event.epc_list.join(", ") }} />
        </>
      )}

      {event.biz_transaction_list && (
        <>
          <Divider>Biz Transactions</Divider>
          <KeyValueTable data={{ Transactions: JSON.stringify(event.biz_transaction_list) }} />
        </>
      )}

      {event.ilmd && (
        <>
          <Divider>ILMD</Divider>
          <KeyValueTable data={event.ilmd} />
        </>
      )}

      {event.extensions && (
        <>
          <Divider>Extensions</Divider>
          <KeyValueTable data={event.extensions} />
        </>
      )}
    </Card>
  );
}
