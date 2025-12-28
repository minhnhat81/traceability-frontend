// EPCISTab_fixed.tsx — full version (React + AntD + DPP Mapping + 3 Form.List)
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Divider,
  Row,
  Col,
  Space,
  message,
  Typography,
  Spin,
  Table,
  Popconfirm,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { api } from "../../api";
import { useAuth } from "../../store/auth";

// ✅ DPP UI bổ sung
import GroupPicker from "@/components/dpp/GroupPicker";
import { DPP_MAPPING } from "@/configs/DPP_MAPPING";

const { Title } = Typography;

const EVENT_TYPES = ["ObjectEvent", "AggregationEvent", "TransformationEvent", "AssociationEvent"];
const ACTIONS = ["ADD", "OBSERVE", "DELETE"];
const BIZ_STEPS = [
  { label: "Commissioning", value: "urn:epcglobal:cbv:bizstep:commissioning" },
  { label: "Harvesting", value: "urn:epcglobal:cbv:bizstep:harvesting" },
  { label: "Receiving", value: "urn:epcglobal:cbv:bizstep:receiving" },
  { label: "Manufacturing", value: "urn:epcglobal:cbv:bizstep:manufacturing" },
  { label: "Packing", value: "urn:epcglobal:cbv:bizstep:packing" },
  { label: "Shipping", value: "urn:epcglobal:cbv:bizstep:shipping" },
  { label: "Storing", value: "urn:epcglobal:cbv:bizstep:storing" },
  { label: "Inspection", value: "urn:epcglobal:cbv:bizstep:inspecting" },
  { label: "Retail", value: "urn:epcglobal:cbv:bizstep:retail_selling" },
];
const DISPOSITIONS = [
  { label: "Active", value: "urn:epcglobal:cbv:disp:active" },
  { label: "In Progress", value: "urn:epcglobal:cbv:disp:in_progress" },
  { label: "Packed", value: "urn:epcglobal:cbv:disp:packed" },
  { label: "In Transit", value: "urn:epcglobal:cbv:disp:in_transit" },
  { label: "Damaged", value: "urn:epcglobal:cbv:disp:damaged" },
  { label: "Expired", value: "urn:epcglobal:cbv:disp:expired" },
  { label: "Destroyed", value: "urn:epcglobal:cbv:disp:destroyed" },
];

const toIso = (d?: Dayjs, off = "+07:00") =>
  d && dayjs(d).isValid() ? `${d.format("YYYY-MM-DDTHH:mm:ss")}${off}` : dayjs().toISOString();

// 🔎 map bizStep URN → eventType (key của DPP_MAPPING)
const mapBizStepToEventType = (bizStep?: string): keyof typeof DPP_MAPPING => {
  const s = (bizStep || "").toLowerCase();
  if (s.includes(":commissioning")) return "commissioning";
  if (s.includes(":manufacturing")) return "transformation";
  if (s.includes(":packing")) return "packing";
  if (s.includes(":shipping")) return "shipping";
  if (s.includes(":receiving")) return "receiving";
  if (s.includes(":inspecting") || s.includes(":retail")) return "observation";
  // storing, others → tạm xem như observation
  if (s.includes(":storing")) return "observation";
  return "commissioning";
};

// Helpers
const SGTIN_PREFIX = "urn:epc:id:sgtin:";
const stripUrn = (x: string) => (x?.startsWith(SGTIN_PREFIX) ? x.slice(SGTIN_PREFIX.length) : x);
const safeJson = (s: string) => {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};
const entriesToObject = (entries?: { key?: string; value?: string }[]) => {
  const obj: Record<string, any> = {};
  (entries || []).forEach((it) => {
    const k = String(it?.key || "").trim();
    if (!k) return;
    obj[k] = safeJson(it?.value ?? "");
  });
  return obj;
};

export default function EPCISTab({ batchCode, batchStatus }: any) {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 1;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<null | any>(null);
  const [viewing, setViewing] = useState<null | any>(null);
  const [preview, setPreview] = useState<any>();
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // ✅ DPP values per-event
  const [dppValues, setDppValues] = useState<Record<string, any>>({});

  const initVals = useMemo(
    () => ({
      eventTime: dayjs(),
      eventTimeZoneOffset: "+07:00",
      action: "ADD",
      type: "ObjectEvent",
      epcList: [""], // list input
      bizTransactionList: [], // list input
      ilmdEntries: [], // cặp key/value động (merge vào ilmd object)
      readpoint_prefix: "8938501000400",
      readpoint_line: "line3",
      bizlocation_prefix: "8938501000400",
      bizStep: "urn:epcglobal:cbv:bizstep:receiving",
      disposition: "urn:epcglobal:cbv:disp:active",
    }),
    []
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, d, e] = await Promise.all([
          api()
            .get(`/api/products?tenant_id=${tenantId}`)
            .catch(() => ({
              data: {
                items: [{ code: "TSHIRT", name: "T-Shirt", category: "Apparel" }],
              },
            })),
          api()
            .get(`/api/documents?batch_code=${batchCode}&tenant_id=${tenantId}`)
            .catch(() => ({
              data: {
                items: [
                  { doc_bundle_id: "BATCH20251019-01-BEGQ", file_name: "GRS.pdf" },
                  { doc_bundle_id: "BATCH20251018-01-RUOJ", file_name: "GOTS.pdf" },
                ],
              },
            })),
          api()
            .get(`/api/epcis/events?batch_code=${batchCode}&tenant_id=${tenantId}`)
            .catch(() => ({ data: { items: [] } })),
        ]);

        setProducts(p.data.items || []);
        const bundleList = (d.data.items || []).map((x: any) => ({
          id: x.doc_bundle_id,
          desc: x.file_name,
        }));
        setBundles(bundleList);
        setEvents(e.data.items || []);
      } catch {
        message.error("Failed to load EPCIS data");
      } finally {
        setLoading(false);
      }
    })();
  }, [batchCode, tenantId]);

  const buildPayload = (v: any, record?: any) => {
    const rpPrefix =
      v?.readpoint_prefix ??
      record?.readPoint?.split("sgln:")[1]?.split(".")[0] ??
      "8938501000400";
    const rpLine =
      v?.readpoint_line ?? record?.readPoint?.split(".")[1] ?? "line3";
    const blPrefix =
      v?.bizlocation_prefix ??
      record?.bizLocation?.split("sgln:")[1] ??
      "8938501000400";

    const et =
      v?.eventTime && dayjs(v.eventTime).isValid()
        ? dayjs(v.eventTime)
        : record?.event_time
        ? dayjs(record.event_time)
        : dayjs();

    // chuyển Form.List ilmdEntries -> object
    const ilmdExtra = entriesToObject(v?.ilmdEntries);

    const payload = {
      "@context": [
        "https://ref.gs1.org/standards/epcis/epcis-context.jsonld",
        { example: "https://example.org/epcis/", gs1: "https://gs1.org/voc/" },
      ],
      tenant_id: tenantId,
      batch_code: record?.batch_code ?? batchCode,
      type: v?.type ?? record?.event_type ?? "ObjectEvent",
      product_code: v?.product_code ?? record?.product_code ?? "TSHIRT",
      eventTime: toIso(et, v?.eventTimeZoneOffset ?? "+07:00"),
      eventTimeZoneOffset: v?.eventTimeZoneOffset ?? "+07:00",
      action: v?.action ?? record?.action ?? "ADD",
      bizStep:
        v?.bizStep ?? record?.bizStep ?? "urn:epcglobal:cbv:bizstep:receiving",
      disposition:
        v?.disposition ?? record?.disposition ?? "urn:epcglobal:cbv:disp:active",
      docBundleId: v?.docBundleId ?? record?.doc_bundle_id,
      readPoint: `urn:epc:id:sgln:${rpPrefix}.${rpLine}`,
      bizLocation: `urn:epc:id:sgln:${blPrefix}`,
      epcList:
        (v?.epcList || record?.epcList || [])
          .filter((x: any) => String(x || "").trim())
          .map((e: any) =>
            e.startsWith(SGTIN_PREFIX) ? e : `${SGTIN_PREFIX}${e}`
          ) ?? [],
      bizTransactionList: v?.bizTransactionList || record?.bizTransactionList || [],
      // ✅ NHÚNG DPP + ilmdEntries vào ilmd
      ilmd: {
        ...(record?.ilmd || v?.ilmd || {}),
        ...(Object.keys(ilmdExtra).length ? ilmdExtra : {}),
        dpp: dppValues && Object.keys(dppValues).length > 0 ? dppValues : undefined,
      },
    };

    return payload;
  };

  const reloadEvents = async () => {
    const res = await api().get(
      `/api/epcis/events?batch_code=${batchCode}&tenant_id=${tenantId}`
    );
    setEvents(res.data.items || []);
  };

  const openAdd = () => {
    setEditing(null);
    setViewing(null);
    setModalOpen(true);
    setDppValues({});
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue(initVals);
      setPreview(buildPayload(initVals));
    }, 0);
  };

  const openEdit = (record: any) => {
    setEditing(record);
    setViewing(null);
    setModalOpen(true);
    setTimeout(() => {
      const rp = record.readPoint || "urn:epc:id:sgln:8938501000400.line3";
      const rpData = rp.split("sgln:")[1];
      const [rpPrefix, rpLine] = rpData?.includes(".")
        ? rpData.split(".")
        : ["8938501000400", "line3"];
      const bl =
        (record.bizLocation || "urn:epc:id:sgln:8938501000400").split("sgln:")[1] ||
        "8938501000400";

      // map epcList (urn -> raw)
      const epcRaw = (record?.epcList || []).map((e: string) => stripUrn(e));
      // map ilmd -> entries (bỏ dpp)
      const ilmd = record?.ilmd || {};
      const ilmdEntries =
        Object.entries(ilmd)
          .filter(([k]) => k !== "dpp")
          .map(([key, value]) => ({
            key,
            value: typeof value === "string" ? value : JSON.stringify(value),
          })) || [];

      form.setFieldsValue({
        type: record.event_type || "ObjectEvent",
        action: record.action || "ADD",
        bizStep: record.bizStep,
        disposition: record.disposition,
        product_code: record.product_code,
        eventTime: record.event_time ? dayjs(record.event_time) : dayjs(),
        eventTimeZoneOffset: "+07:00",
        docBundleId: record.doc_bundle_id,
        readpoint_prefix: rpPrefix,
        readpoint_line: rpLine,
        bizlocation_prefix: bl,
        epcList: epcRaw,
        bizTransactionList: record.bizTransactionList || [],
        ilmdEntries,
      });

      // ✅ Nếu event cũ đã có ilmd.dpp → nạp lại vào UI
      const prevDpp = record?.ilmd?.dpp || {};
      setDppValues(prevDpp);

      setPreview(buildPayload(form.getFieldsValue(), record));
    }, 0);
  };

  // ✅ xem payload EPCIS đầy đủ
  const openView = (record: any) => {
    const payload = buildPayload({}, record);
    setViewing(payload);
    setEditing(null);
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const v = await form.validateFields();
      const payload = buildPayload(v, editing || { batch_code: batchCode });

      if (editing?.event_id) {
        await api().put(`/api/epcis/events/${editing.event_id}`, payload);
        message.success("EPCIS Event updated!");
      } else {
        await api().post("/api/epcis/capture", payload);
        message.success("EPCIS Event captured!");
      }

      setModalOpen(false);
      setEditing(null);
      setViewing(null);
      await reloadEvents();
    } catch (e: any) {
      console.error("[EPCIS] submit failed", e);
      message.error(e?.response?.data?.detail || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // 🟢 đặt hook ở top-level, không trong điều kiện hoặc useMemo
  const watchedBizStep = Form.useWatch("bizStep", form);

  // 🟢 tính toán loại event dựa vào giá trị bizStep
  const currentEventTypeKey = useMemo(
    () => mapBizStepToEventType(watchedBizStep ?? "urn:epcglobal:cbv:bizstep:commissioning"),
    [watchedBizStep]
  );

  if (loading) return <Spin style={{ marginTop: 80 }} />;

  return (
    <div>
      <Card
        title={<Title level={5}>EPCIS Capture — Batch {batchCode}</Title>}
        extra={
          batchStatus !== "CLOSED" && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Add EPCIS Event
            </Button>
          )
        }
      />

      <Divider orientation="left">EPCIS Event List</Divider>
      <Table
        rowKey="event_id"
        dataSource={events}
        pagination={{ pageSize: 5 }}
        columns={[
          { title: "Event ID", dataIndex: "event_id" },
          { title: "Product Code", dataIndex: "product_code" },
          { title: "BizStep", dataIndex: "bizStep" },
          { title: "Disposition", dataIndex: "disposition" },
          { title: "Doc Bundle", dataIndex: "doc_bundle_id" },
          {
            title: "Created Time",
            dataIndex: "created_at",
            render: (t: string) => (t ? dayjs(t).format("YYYY-MM-DD HH:mm") : "-"),
          },
          {
            title: "Action",
            render: (_: any, record: any) => (
              <Space>
                <Button icon={<EyeOutlined />} size="small" onClick={() => openView(record)} />
                <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
                <Popconfirm
                  title="Delete event?"
                  onConfirm={() =>
                    api()
                      .delete(`/api/epcis/events/${record.event_id}`)
                      .then(() => reloadEvents())
                  }
                >
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={
          viewing
            ? "View EPCIS Event"
            : editing
            ? "Edit EPCIS Event"
            : "Add EPCIS Event"
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setViewing(null);
          setEditing(null);
        }}
        onOk={viewing ? undefined : onSubmit}
        okButtonProps={{ loading: submitting, disabled: !!viewing }}
        width={980}
        destroyOnClose
      >
        {viewing ? (
          <pre
            style={{
              maxHeight: 420,
              overflow: "auto",
              background: "#f7f7f7",
              padding: 12,
            }}
          >
            {JSON.stringify(viewing, null, 2)}
          </pre>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={initVals}
            onValuesChange={() => setPreview(buildPayload(form.getFieldsValue(), editing || undefined))}
          >
            <Row gutter={12}>
              {/* CỘT TRÁI: Form EPCIS (giữ nguyên) */}
              <Col span={14}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name="type"
                      label="Event Type"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={EVENT_TYPES.map((v) => ({ label: v, value: v }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="action"
                      label="Action"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={ACTIONS.map((v) => ({ label: v, value: v }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name="bizStep"
                      label="BizStep"
                      rules={[{ required: true }]}
                    >
                      <Select options={BIZ_STEPS} showSearch optionFilterProp="label" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="disposition"
                      label="Disposition"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={DISPOSITIONS}
                        showSearch
                        optionFilterProp="label"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name="product_code"
                      label="Product"
                      rules={[{ required: true }]}
                    >
                      <Select
                        showSearch
                        options={products.map((p) => ({
                          label: `${p.code} — ${p.name || ""}`,
                          value: p.code,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="docBundleId"
                      label="Doc Bundle"
                      rules={[{ required: true }]}
                    >
                      <Select
                        showSearch
                        options={bundles.map((b) => ({
                          label: `${b.id} — ${b.desc}`,
                          value: b.id,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name="eventTime"
                      label="Event Time"
                      rules={[{ required: true }]}
                    >
                      <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="eventTimeZoneOffset"
                      label="TZ Offset"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="+07:00" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item
                      name="readpoint_prefix"
                      label="ReadPoint Prefix"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="8938501000400" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="readpoint_line"
                      label="ReadPoint Line"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="line3" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="bizlocation_prefix"
                      label="Biz Location Prefix"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="8938501000400" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* ====== 👇 NEW: EPC LIST ====== */}
                <Divider orientation="left" plain>
                  EPC List (SGTIN)
                </Divider>
                <Form.List name="epcList">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, idx) => (
                        <Space key={field.key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                          <Form.Item
                            {...field}
                            label={idx === 0 ? "SGTIN" : undefined}
                            name={field.name}
                            fieldKey={field.fieldKey}
                            rules={[{ required: true, message: "Nhập SGTIN, ví dụ 8938501000400.012345.01" }]}
                          >
                            <Input placeholder="companyPrefix.itemRef.serial" />
                          </Form.Item>
                          <Button danger size="small" onClick={() => remove(field.name)}>
                            Xoá
                          </Button>
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add("")} block>
                        + Thêm SGTIN
                      </Button>
                    </>
                  )}
                </Form.List>

                {/* ====== 👇 NEW: BizTransaction List ====== */}
                <Divider orientation="left" plain>
                  Biz Transactions
                </Divider>
                <Form.List name="bizTransactionList">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...rest }) => (
                        <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                          <Form.Item
                            {...rest}
                            name={[name, "type"]}
                            label="Type"
                            rules={[{ required: true, message: "Chọn loại giao dịch" }]}
                          >
                            <Select
                              style={{ width: 160 }}
                              options={[
                                { label: "po", value: "po" },
                                { label: "inv", value: "inv" },
                                { label: "desadv", value: "desadv" },
                                { label: "other", value: "other" },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item
                            {...rest}
                            name={[name, "id"]}
                            label="ID/URN"
                            rules={[{ required: true, message: "Nhập ID / URN" }]}
                          >
                            <Input style={{ width: 260 }} placeholder="ví dụ: urn:epcglobal:cbv:bt:po:12345" />
                          </Form.Item>
                          <Button danger size="small" onClick={() => remove(name)}>
                            Xoá
                          </Button>
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add({ type: "po", id: "" })} block>
                        + Thêm Biz Transaction
                      </Button>
                    </>
                  )}
                </Form.List>

                {/* ====== 👇 NEW: ILMD (key/value) ====== */}
                <Divider orientation="left" plain>
                  ILMD (Key / Value)
                </Divider>
                <Form.List name="ilmdEntries">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...rest }) => (
                        <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                          <Form.Item
                            {...rest}
                            name={[name, "key"]}
                            label="Key"
                            rules={[{ required: true, message: "Nhập key ví dụ: color" }]}
                          >
                            <Input style={{ width: 160 }} placeholder="key" />
                          </Form.Item>
                          <Form.Item
                            {...rest}
                            name={[name, "value"]}
                            label="Value (text/JSON)"
                            rules={[{ required: true, message: "Nhập value" }]}
                          >
                            <Input.TextArea style={{ width: 260 }} placeholder='ví dụ: "blue" hoặc {"grade":"A"}' />
                          </Form.Item>
                          <Button danger size="small" onClick={() => remove(name)}>
                            Xoá
                          </Button>
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add({ key: "", value: "" })} block>
                        + Thêm cặp Key/Value
                      </Button>
                    </>
                  )}
                </Form.List>
              </Col>

              {/* CỘT PHẢI: DPP cho sự kiện */}
              <Col span={10}>
                <Card title="DPP cho sự kiện" size="small">
                  <GroupPicker
                    eventType={currentEventTypeKey}
                    mapping={DPP_MAPPING}
                    values={dppValues}
                    onChange={setDppValues}
                  />
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>
    </div>
  );
}
