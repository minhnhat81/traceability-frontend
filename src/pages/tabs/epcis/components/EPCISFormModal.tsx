// src/pages/tabs/epcis/components/EPCISFormModal.tsx

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Divider,
  Row,
  Col,
  Space,
  message,
  DatePicker,
  Button,
} from "antd";
import dayjs from "dayjs";
import { api } from "@/api";
import { useAuth } from "@/store/auth";
import {
  EVENT_TYPES,
  ACTIONS,
  BIZ_STEPS,
  DISPOSITIONS,
} from "../utils/epcisConstants";
import {
  toIso,
  entriesToObject,
  mapBizStepToEventType,
  stripUrn,
} from "../utils/epcisHelpers";
import DPPPanel from "./EPCISDPPPanel";
import { Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";


export default function EPCISFormModal({
  open,
  editing,
  batchCode,
  batchStatus,
  onClose,
  onReload,
}) {
  const [form] = Form.useForm();
  const { tenant } = useAuth() as any;
  const tenantId = tenant?.id || 1;

  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [bundles, setBundles] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const [dppValues, setDppValues] = useState({});
  const [openDpp, setOpenDpp] = useState(false);
  const [viewing, setViewing] = useState(null);

  /** ===============================
   * DEFAULT FORM VALUES
   ================================== */
  const initVals = useMemo(
    () => ({
      eventTime: dayjs(),
      eventTimeZoneOffset: "+07:00",
      action: "ADD",
      type: "ObjectEvent",
      epcList: [""],
      bizTransactionList: [],
      ilmdEntries: [],

      /** READPOINT — GS1 SGLN */
      readpoint_prefix: "8938501000400",
      readpoint_line: "line3",

      /** BIZLOCATION — GS1 SGLN (NEW) */
      bizlocation_prefix: "8938501000400",
      bizlocation_line: "line1",

      bizStep: "urn:epcglobal:cbv:bizstep:receiving",
      disposition: "urn:epcglobal:cbv:disp:active",

      product_code: undefined,
      material_id: undefined,
      docBundleId: undefined,
    }),
    []
  );

  /** ===============================
   * LOAD PRODUCTS / MATERIALS / BUNDLES
   ================================== */
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [p, m, d] = await Promise.all([
          api().get(`/api/products?tenant_id=${tenantId}`),
          api().get(`/materials/?tenant_id=${tenantId}`),
          api().get(`/api/documents?batch_code=${batchCode}&tenant_id=${tenantId}`),
        ]);

        setProducts(p.data.items || p.data || []);
        setMaterials(Array.isArray(m.data) ? m.data : m.data.items || []);

        const bundleList =
          (d.data.items || []).map((x) => ({
            id: x.doc_bundle_id,
            desc: x.file_name,
          })) || [];

        setBundles(bundleList);
      } catch {
        message.warning("Failed to load lookup data");
      }
    })();
  }, [open]);

  /** ===============================
   * ON OPEN → SET FORM DATA
   ================================== */
  useEffect(() => {
  if (!open) {
    setViewing(null);     // 🔥 BẮT BUỘC
    setDppValues({});
    form.resetFields();
    return;
  }

    if (!editing) {
      form.setFieldsValue(initVals);
      setViewing(null);
      setDppValues({});
      return;
    }

    if (editing.viewOnly) {
      setViewing(editing);
      return;
    }

    /** ---------- READPOINT ---------- */
    const rp =
      editing.read_point ||
      editing.readPoint ||
      "urn:epc:id:sgln:8938501000400.line3";

    const rpData = rp.split("sgln:")[1];
    const [rpPrefix, rpLine] = rpData?.split(".") || ["8938501000400", "line3"];

    /** ---------- BIZLOCATION (NEW) ---------- */
    const bl =
      editing.biz_location ||
      editing.bizLocation ||
      "urn:epc:id:sgln:8938501000400.line1";

    const blData = bl.split("sgln:")[1];
    const [blPrefix, blLine] = blData?.split(".") || ["8938501000400", "line1"];

    /** ---------- EPC LIST ---------- */
    const epcRaw = (editing.epc_list || []).map((e) => stripUrn(e));

    /** ---------- ILMD ---------- */
    const ilmd = editing.ilmd || {};
    const ilmdEntries =
      Object.entries(ilmd)
        .filter(([k]) => k !== "dpp")
        .map(([key, value]) => ({
          key,
          value: typeof value === "string" ? value : JSON.stringify(value, null, 2),
        })) || [];

    /** ---------- FILL FORM ---------- */
    form.setFieldsValue({
      type: editing.event_type || "ObjectEvent",
      action: editing.action || "ADD",
      bizStep: editing.biz_step,
      disposition: editing.disposition,

      eventTime: editing.event_time ? dayjs(editing.event_time) : dayjs(),
      eventTimeZoneOffset: editing.event_time_zone_offset || "+07:00",

      product_code: editing.product_code,
      material_id: editing.material_id,
      docBundleId: editing.doc_bundle_id,

      readpoint_prefix: rpPrefix,
      readpoint_line: rpLine,

      bizlocation_prefix: blPrefix,
      bizlocation_line: blLine,

      epcList: epcRaw.length ? epcRaw : [""],
      bizTransactionList: editing.biz_transaction_list || [],

      ilmdEntries,
    });

    setDppValues(editing?.ilmd?.dpp || {});
  }, [open, editing]);

  /** ===============================
   * BUILD PAYLOAD
   ================================== */
  const buildPayload = (v) => {
    const et = v.eventTime ? dayjs(v.eventTime) : dayjs();

    const ilmdExtra = entriesToObject(v.ilmdEntries);

    return {
      "@context": [
        "https://ref.gs1.org/standards/epcis/epcis-context.jsonld",
        { example: "https://example.org/epcis/" },
      ],

      tenant_id: tenantId,
      batch_code: batchCode,

      type: v.type,
      action: v.action,
      bizStep: v.bizStep,
      disposition: v.disposition,

      eventTime: toIso(et, v.eventTimeZoneOffset),
      eventTimeZoneOffset: v.eventTimeZoneOffset,

      /** ---------- GS1 SGLN ReadPoint ---------- */
      readPoint: `urn:epc:id:sgln:${v.readpoint_prefix}.${v.readpoint_line}`,

      /** ---------- GS1 SGLN BizLocation (NEW) ---------- */
      bizLocation: `urn:epc:id:sgln:${v.bizlocation_prefix}.${v.bizlocation_line}`,

      docBundleId: v.docBundleId,

      epcList: (v.epcList || [])
        .filter((x) => String(x || "").trim())
        .map((e) =>
          e.startsWith("urn:epc:id:sgtin:") ? e : `urn:epc:id:sgtin:${e}`
        ),

      bizTransactionList: v.bizTransactionList || [],

      ilmd: {
        ...ilmdExtra,
        dpp: Object.keys(dppValues).length ? dppValues : undefined,
      },

      product_code: v.product_code,
      material_id: v.material_id,
    };
  };

  /** ===============================
   * SUBMIT
   ================================== */
  const onSubmit = async () => {
    try {
      const v = await form.validateFields();

      const payload = buildPayload(v);

      setSubmitting(true);

      if (editing?.event_id) {
        await api().put(`/api/epcis/events/${editing.event_id}`, payload);
        message.success("EPCIS event updated!");
      } else {
        await api().post(`/api/epcis/capture`, payload);
        message.success("EPCIS event created!");
      }

      setSubmitting(false);
      onClose();
      onReload();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.detail || "Submit failed");
      setSubmitting(false);
    }
  };

  /** ===============================
   * RENDER
   ================================== */
  return (
    <Modal
      title={editing ? "Edit EPCIS Event" : "Add EPCIS Event"}
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okButtonProps={{ loading: submitting, disabled: !!viewing }}
      width={980}
      destroyOnClose
    >
      {viewing ? (
        <pre style={{ maxHeight: 420, overflow: "auto" }}>
          {JSON.stringify(viewing, null, 2)}
        </pre>
      ) : (
        <Form form={form} layout="vertical" initialValues={initVals}>
          <Row gutter={12}>
            <Col span={24}>
              {/* EVENT TYPE + ACTION */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="type" label="Event Type" rules={[{ required: true }]}>
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
                    <Select options={ACTIONS.map((v) => ({ label: v, value: v }))} />
                  </Form.Item>
                </Col>
              </Row>

              {/* BIZ STEP + DISPOSITION */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="bizStep" label="BizStep" rules={[{ required: true }]}>
                    <Select options={BIZ_STEPS} showSearch optionFilterProp="label" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="disposition"
                    label="Disposition"
                    rules={[{ required: true }]}
                  >
                    <Select options={DISPOSITIONS} showSearch optionFilterProp="label" />
                  </Form.Item>
                </Col>
              </Row>

              {/* MATERIAL + PRODUCT */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="material_id" label="Material">
                    <Select
                      allowClear
                      showSearch
                      options={materials.map((m) => ({
                        label: m.name,
                        value: m.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="product_code" label="Product">
                    <Select
                      allowClear
                      showSearch
                      options={products.map((p) => ({
                        label: `${p.code} — ${p.name}`,
                        value: p.code,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* DOC BUNDLE + TIME */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
  label="Doc Bundle"
  required
>
  <Row gutter={8} align="middle">
    {/* Select Doc Bundle */}
    <Col flex="auto">
      <Form.Item
        name="doc_bundle"
        noStyle
        rules={[{ required: true, message: "Please select doc bundle" }]}
      >
        <Select placeholder="Select doc bundle" />
      </Form.Item>
    </Col>

    {/* Upload Button */}
    <Col>
      <Upload
        multiple
        showUploadList={false}
        beforeUpload={(file) => {
          const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];

          if (!allowedTypes.includes(file.type)) {
            message.error("Only PDF / JPG / PNG / DOCX allowed");
            return Upload.LIST_IGNORE;
          }

          if (file.size / 1024 / 1024 > 10) {
            message.error("Max file size is 10MB");
            return Upload.LIST_IGNORE;
          }

          return false; // ❗ không auto upload
        }}
      >
        <Button icon={<UploadOutlined />}>Upload</Button>
      </Upload>
    </Col>
  </Row>
</Form.Item>

                </Col>
                <Col span={12}>
                  <Form.Item name="eventTime" label="Event Time" rules={[{ required: true }]}>
                    <DatePicker showTime style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* TZ + READPOINT */}
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="eventTimeZoneOffset" label="TZ Offset">
                    <Input placeholder="+07:00" />
                  </Form.Item>
                </Col>

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
              </Row>

              {/* ==========================
                  🟣 NEW BIZLOCATION INPUT
                 ========================== */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="bizlocation_prefix"
                    label="BizLocation Prefix"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="8938501000400" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="bizlocation_line"
                    label="BizLocation Line"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="line1" />
                  </Form.Item>
                </Col>
              </Row>

              {/* EPC LIST */}
              <Form.List name="epcList">
                {(fields, { add, remove }) => (
                  <>
                    <Divider orientation="left">EPC List</Divider>
                    {fields.map((field) => (
                      <Space key={field.key} align="baseline">
                        <Form.Item {...field} name={field.name}>
                          <Input placeholder="companyPrefix.itemRef.serial" />
                        </Form.Item>
                        <Button danger size="small" onClick={() => remove(field.name)}>
                          Remove
                        </Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add("")}>
                      + Add EPC
                    </Button>
                  </>
                )}
              </Form.List>

              {/* BIZ TRANSACTIONS */}
              <Form.List name="bizTransactionList">
                {(fields, { add, remove }) => (
                  <>
                    <Divider orientation="left">Biz Transactions</Divider>
                    {fields.map(({ key, name, ...rest }) => (
                      <Space key={key} align="baseline">
                        <Form.Item
                          {...rest}
                          name={[name, "type"]}
                          label="Type"
                          rules={[{ required: true }]}
                        >
                          <Select
                            style={{ width: 120 }}
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
                          rules={[{ required: true }]}
                        >
                          <Input style={{ width: 240 }} />
                        </Form.Item>

                        <Button danger size="small" onClick={() => remove(name)}>
                          Remove
                        </Button>
                      </Space>
                    ))}

                    <Button type="dashed" onClick={() => add({ type: "po", id: "" })}>
                      + Add Transaction
                    </Button>
                  </>
                )}
              </Form.List>

              {/* ILMD */}
              <Form.List name="ilmdEntries">
                {(fields, { add, remove }) => (
                  <>
                    <Divider orientation="left">ILMD Key/Value</Divider>
                    {fields.map(({ key, name, ...rest }) => (
                      <Space key={key} align="baseline">
                        <Form.Item
                          {...rest}
                          name={[name, "key"]}
                          label="Key"
                          rules={[{ required: true }]}
                        >
                          <Input style={{ width: 140 }} />
                        </Form.Item>

                        <Form.Item
                          {...rest}
                          name={[name, "value"]}
                          label="Value"
                          rules={[{ required: true }]}
                        >
                          <Input.TextArea
                            style={{ width: 240 }}
                            placeholder='text hoặc {"grade":"A"}'
                          />
                        </Form.Item>

                        <Button danger size="small" onClick={() => remove(name)}>
                          Remove
                        </Button>
                      </Space>
                    ))}

                    <Button type="dashed" onClick={() => add({ key: "", value: "" })}>
                      + Add ILMD
                    </Button>
                  </>
                )}
              </Form.List>

              {/* DPP BLOCK */}
              <Divider />
              <Space>
                <strong>DPP for this event</strong>
                <Button type="primary" size="small" onClick={() => setOpenDpp(true)}>
                  + Add DPP
                </Button>
              </Space>

              {Object.keys(dppValues).length > 0 && (
                <pre
                  style={{
                    background: "#fafafa",
                    padding: 8,
                    marginTop: 8,
                    border: "1px solid #eee",
                    borderRadius: 6,
                    maxHeight: 220,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(dppValues, null, 2)}
                </pre>
              )}
            </Col>
          </Row>
        </Form>
      )}

      <DPPPanel
        open={openDpp}
        onCancel={() => setOpenDpp(false)}
        eventTypeKey={mapBizStepToEventType(Form.useWatch("bizStep", form))}
        onChange={setDppValues}
        initialValues={dppValues}
      />
    </Modal>
  );
}
