import { useEffect, useMemo, useState } from "react";
import {
  Card, Form, Input, Select, DatePicker, Button, Space,
  Divider, Row, Col, message, Typography, Spin
} from "antd";
import {
  PlusOutlined, DeleteOutlined,
  SendOutlined, ReloadOutlined
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { api } from "../api";
import BatchManager from "./Batches"; // thêm import

const { Title } = Typography;

/*──────────────────────────────
 🔹 Constants & Template Config
──────────────────────────────*/
const EVENT_TYPES = [
  "ObjectEvent",
  "AggregationEvent",
  "TransformationEvent",
  "AssociationEvent",
];
const ACTIONS = ["ADD", "OBSERVE", "DELETE"];
const BIZ_TEMPLATES = [
  { value: "commissioning", label: "Commissioning" },
  { value: "receiving", label: "Receiving" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "transforming", label: "Transforming" },
  { value: "packing", label: "Packing" },
  { value: "shipping", label: "Shipping" },
  { value: "storing", label: "Storing" },
  { value: "inspecting", label: "Inspecting" },
];
const BIZ_TX_TYPES = [
  { value: "po", label: "Purchase Order" },
  { value: "inv", label: "Invoice" },
  { value: "desadv", label: "Despatch Advice" },
  { value: "recadv", label: "Receiving Advice" },
  { value: "ship", label: "Shipment" },
  { value: "payment", label: "Payment" },
];
const TEMPLATE_CONFIG = {
  commissioning: {
    action: "ADD",
    bizStep: "urn:epcglobal:cbv:bizstep:commissioning",
    disposition: "urn:epcglobal:cbv:disp:active",
    type: "ObjectEvent",
  },
  receiving: {
    action: "OBSERVE",
    bizStep: "urn:epcglobal:cbv:bizstep:receiving",
    disposition: "urn:epcglobal:cbv:disp:active",
    type: "ObjectEvent",
  },
  manufacturing: {
    action: "ADD",
    bizStep: "urn:epcglobal:cbv:bizstep:manufacturing",
    disposition: "urn:epcglobal:cbv:disp:in_progress",
    type: "TransformationEvent",
  },
  transforming: {
    action: "ADD",
    bizStep: "urn:epcglobal:cbv:bizstep:transforming",
    disposition: "urn:epcglobal:cbv:disp:in_progress",
    type: "TransformationEvent",
  },
  packing: {
    action: "ADD",
    bizStep: "urn:epcglobal:cbv:bizstep:packing",
    disposition: "urn:epcglobal:cbv:disp:packed",
    type: "AggregationEvent",
  },
  shipping: {
    action: "OBSERVE",
    bizStep: "urn:epcglobal:cbv:bizstep:shipping",
    disposition: "urn:epcglobal:cbv:disp:in_transit",
    type: "ObjectEvent",
  },
};

/*──────────────────────────────
 🔹 Utility
──────────────────────────────*/
const toIso = (d?: Dayjs, off = "+07:00") =>
  d ? `${d.format("YYYY-MM-DDTHH:mm:ss")}${off}` : undefined;

/*──────────────────────────────
 🔹 Component
──────────────────────────────*/
export default function EPCISCapture() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [readpoints, setReadpoints] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]); // previous receiving

  const initVals = useMemo(
    () => ({
      eventTime: dayjs(),
      eventTimeZoneOffset: "+07:00",
      action: "ADD",
      type: "ObjectEvent",
      epcList: [""],
      inputEpcList: [],
      bizTransactionList: [],
    }),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const [p, b, r, l, e, ba] = await Promise.all([
          api().get("/api/products").catch(() => ({
            data: { items: [{ code: "TSHIRT", name: "T-Shirt", category: "Apparel" }] },
          })),
          api().get("/api/batches").catch(() => ({
            data: { items: [{ code: "LOT-202510-A", product_code: "TSHIRT", qty: 1000 }] },
          })),
          api().get("/api/locations/readpoints").catch(() => ({
            data: { items: [{ uri: "urn:epc:id:sgln:8938501000400.line3", label: "Line 3" }] },
          })),
          api().get("/api/locations/biz").catch(() => ({
            data: { items: [{ uri: "urn:epc:id:sgln:8938501000400", label: "Factory A" }] },
          })),
          api().get("/api/epcis/events?type=receiving").catch(() => ({
            data: { items: [{ id: "EVT001", batch_code: "LOT-RAW001", product_code: "FABRIC" }] },
          })),
          api().get("/api/documents/bundles").catch(() => ({
            data: { items: [{ id: "BUNDLE202510", desc: "Shipment bundle Oct 2025" }] },
          })),
        ]);
        setProducts(p.data.items);
        setBatches(b.data.items);
        setReadpoints(r.data.items);
        setLocations(l.data.items);
        setEvents(e.data.items);
        setBundles(ba.data.items);
      } catch {
        message.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /*──────────────────────────────
    Template Auto-fill
  ──────────────────────────────*/
  const onTemplateChange = (val: string) => {
    const conf = TEMPLATE_CONFIG[val];
    if (conf) {
      form.setFieldsValue({
        action: conf.action,
        bizStep: conf.bizStep,
        disposition: conf.disposition,
        type: conf.type,
        readPoint: readpoints[0]?.uri,
        bizLocation: locations[0]?.uri,
      });
      message.success(`Template "${val}" applied`);
    }
  };

  /*──────────────────────────────
    Build Payload
  ──────────────────────────────*/
  const buildPayload = (v: any) => {
    const p: any = {
      "@context": [
        "https://ref.gs1.org/standards/epcis/epcis-context.jsonld",
        { example: "https://example.org/epcis/", gs1: "https://gs1.org/voc/" },
      ],
      type: v.type,
      batch_code: v.batch_code,
      product_code: v.product_code,
      eventTime: toIso(v.eventTime, v.eventTimeZoneOffset),
      eventTimeZoneOffset: v.eventTimeZoneOffset,
      action: v.action,
      bizStep: v.bizStep,
      disposition: v.disposition,
      readPoint: v.readPoint,
      bizLocation: v.bizLocation,
      epcList: v.epcList?.filter(Boolean),
      bizTransactionList: (v.bizTransactionList || []).filter((r: any) => r.type && r.id),
    };
    if (v.docBundleId) p.docBundleId = v.docBundleId;
    if (v.linked_event_id) p.linked_event_id = v.linked_event_id;
    if (v.inputEpcList?.length) p.inputEpcList = v.inputEpcList;
    if (v.parentPallet) p.parentID = v.parentPallet;
    return p;
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const v = await form.validateFields();
      const payload = buildPayload(v);
      await api().post("/api/epcis/capture", payload);
      message.success("EPCIS Event captured!");
      setPreview(payload);
    } catch (e: any) {
      message.error(e?.response?.data?.detail || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin style={{ marginTop: 80 }} />;

  /*──────────────────────────────
    UI
  ──────────────────────────────*/
  return (
    <div className="container">
      <Card
        title={<Title level={4}>EPCIS Event Capture v4</Title>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()}>Reset</Button>
            <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={onSubmit}>
              Submit
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={initVals}>
          <Divider orientation="left">Event Basics</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Template" name="template">
                <Select options={BIZ_TEMPLATES} onChange={onTemplateChange} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Type" name="type">
                <Select options={EVENT_TYPES.map((x) => ({ value: x, label: x }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Action" name="action">
                <Select options={ACTIONS.map((a) => ({ value: a, label: a }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Event Time" name="eventTime">
                <DatePicker showTime style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Timezone Offset" name="eventTimeZoneOffset">
                <Input placeholder="+07:00" />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item label="Batch (Lot)" name="batch_code" rules={[{ required: true }]}>
                <Select
                  placeholder="Select batch"
                  options={batches.map((b) => ({
                    value: b.code,
                    label: `${b.code} — ${b.product_code}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item label="Product" name="product_code" rules={[{ required: true }]}>
                <Select
                  placeholder="Select product"
                  options={products.map((p) => ({
                    value: p.code,
                    label: `${p.category} / ${p.name}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Business Context</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Read Point" name="readPoint">
                <Select options={readpoints.map((r) => ({ value: r.uri, label: r.label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Business Location" name="bizLocation">
                <Select options={locations.map((l) => ({ value: l.uri, label: l.label }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Doc Bundle (optional)" name="docBundleId">
            <Select
              allowClear
              options={bundles.map((b) => ({ value: b.id, label: `${b.id} — ${b.desc}` }))}
            />
          </Form.Item>

          {/* Only show pallet if packing */}
          {form.getFieldValue("template") === "packing" && (
            <>
              <Divider orientation="left">Pallet Info</Divider>
              <Form.Item label="Parent Pallet EPC" name="parentPallet">
                <Input placeholder="urn:epc:id:sscc:8938501.0000001234567890" />
              </Form.Item>
            </>
          )}

          {/* Show linked event for transforming */}
          {form.getFieldValue("template") === "transforming" && (
            <>
              <Divider orientation="left">Link Previous Event</Divider>
              <Form.Item label="Previous Receiving Event" name="linked_event_id">
                <Select
                  showSearch
                  options={events.map((e) => ({
                    value: e.id,
                    label: `${e.id} — ${e.product_code} (${e.batch_code})`,
                  }))}
                />
              </Form.Item>
            </>
          )}

          {/* Input EPCs (split/merge) */}
          {["transforming", "manufacturing"].includes(form.getFieldValue("template")) && (
            <>
              <Divider orientation="left">Input EPCs (Split / Merge)</Divider>
              <Form.List name="inputEpcList">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((f) => (
                      <Space key={f.key} style={{ display: "flex", marginBottom: 8 }}>
                        <Form.Item {...f} style={{ flex: 1 }}>
                          <Input placeholder="urn:epc:id:sgtin:..." />
                        </Form.Item>
                        <Button danger icon={<DeleteOutlined />} onClick={() => remove(f.name)} />
                      </Space>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={() => add("")}>Add Input EPC</Button>
                  </>
                )}
              </Form.List>
            </>
          )}

          <Divider orientation="left">EPC List</Divider>
          <Form.List name="epcList">
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item {...f} style={{ flex: 1 }}>
                      <Input placeholder="urn:epc:id:sgtin:..." />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(f.name)} />
                  </Space>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add("")}>Add EPC</Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left">Business Transactions</Divider>
          <Form.List name="bizTransactionList">
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item name={[f.name, "type"]}>
                      <Select options={BIZ_TX_TYPES} style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item name={[f.name, "id"]}>
                      <Input addonBefore="urn:epcglobal:cbv:bt:" placeholder="INV:20251015" style={{ width: 400 }} />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(f.name)} />
                  </Space>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({})}>Add Transaction</Button>
              </>
            )}
          </Form.List>

          <Divider />
          <Card type="inner" title="JSON Preview">
            <pre style={{ maxHeight: 250, overflow: "auto" }}>
              {JSON.stringify(buildPayload(form.getFieldsValue()), null, 2)}
            </pre>
          </Card>
        </Form>
      </Card>
    </div>
  );
}
