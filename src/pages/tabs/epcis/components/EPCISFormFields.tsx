import { Form, Input, Select, DatePicker, Divider, Button, Space } from "antd";
import { EVENT_TYPES, ACTIONS, BIZ_STEPS, DISPOSITIONS } from "../utils/epcisConstants";

export default function EPCISFormFields({ form, mode }: any) {
  return (
    <Form form={form} layout="vertical">
      <Form.Item name="type" label="Event Type" rules={[{ required: true }]}>
        <Select options={EVENT_TYPES.map((v) => ({ label: v, value: v }))} />
      </Form.Item>

      <Form.Item name="action" label="Action" rules={[{ required: true }]}>
        <Select options={ACTIONS.map((v) => ({ label: v, value: v }))} />
      </Form.Item>

      <Form.Item name="bizStep" label="BizStep" rules={[{ required: true }]}>
        <Select options={BIZ_STEPS} showSearch />
      </Form.Item>

      <Form.Item name="disposition" label="Disposition" rules={[{ required: true }]}>
        <Select options={DISPOSITIONS} showSearch />
      </Form.Item>

      <Form.Item name="eventTime" label="Event Time" rules={[{ required: true }]}>
        <DatePicker showTime style={{ width: "100%" }} />
      </Form.Item>

      <Divider plain>EPC List</Divider>
      <Form.List name="epcList">
        {(fields, { add, remove }) => (
          <>
            {fields.map((f) => (
              <Space key={f.key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                <Form.Item {...f} rules={[{ required: true, message: "Enter EPC" }]}>
                  <Input placeholder="companyPrefix.itemRef.serial" />
                </Form.Item>
                <Button danger size="small" onClick={() => remove(f.name)}>Xoá</Button>
              </Space>
            ))}
            <Button type="dashed" onClick={() => add("")} block>+ Add EPC</Button>
          </>
        )}
      </Form.List>
    </Form>
  );
}
