import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../store/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { RefreshCw, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import { Tabs, Tag } from "antd";
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  type Batch as RowBatch,
  type BatchCreate,
} from "../services/batchesService";
import { api } from "../api";
import { getMaterials, Material } from "../services/materialService"; // ✅ dùng service chuẩn

const LEVELS = ["farm", "supplier", "manufacturer", "brand"] as const;
type Level = (typeof LEVELS)[number];

const PARENT_OF: Record<Level, null | Level> = {
  farm: null,
  supplier: "farm",
  manufacturer: "supplier",
  brand: "manufacturer",
};

const CODE_FIELD_BY_LEVEL: Record<Level, keyof RowBatch> = {
  farm: "code",
  supplier: "code",
  manufacturer: "code",
  brand: "code",
};

const PARENT_ID_FIELD_BY_LEVEL: Record<Level, keyof RowBatch | null> = {
  farm: null,
  supplier: "farm_batch_id",
  manufacturer: "supplier_batch_id",
  brand: "manufacturer_batch_id",
};

const PARENT_CODE_FIELD_BY_LEVEL: Record<Level, keyof RowBatch | null> = {
  farm: null,
  supplier: "farm_batch_code",
  manufacturer: "supplier_batch_code",
  brand: "manufacturer_batch_code",
};

const TITLE_BY_LEVEL: Record<Level, string> = {
  farm: "Farm Batches",
  supplier: "Supplier Batches",
  manufacturer: "Manufacturer Batches",
  brand: "Brand Batches",
};

export default function Batches() {
  return (
    <div className="space-y-4">
      <Tabs
        defaultActiveKey="farm"
        items={[
          ...LEVELS.map((lv) => ({
            key: lv,
            label: TITLE_BY_LEVEL[lv],
            children: <BatchTab level={lv} />,
          })),
          { key: "links", label: "🔗 Links", children: <BatchLinks /> },
        ]}
      />
    </div>
  );
}

function BatchTab({ level }: { level: Level }) {
  const { toast } = useToast();
  const auth = useAuth() as any;
  const tenant = auth?.tenant; // giữ lại tenant để gọi API theo id


  const [rows, setRows] = useState<RowBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<RowBatch | null>(null);
  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const parentLevel = PARENT_OF[level];
  const [parentOptions, setParentOptions] = useState<
    { value: number; label: string; code: string }[]
  >([]);

  const [form, setForm] = useState({
    product_code: "",
    quantity: 0,
    unit: "",
    mfg_date: "",
    country: "VN",
    status: "active",
    material_type: "",
    description: "",
    current_code: "",
    parent_id: "",
    parent_code_display: "",
  });

  const currentCodeLabel = useMemo(() => {
    switch (level) {
      case "farm":
        return "Batch Code (Farm)";
      case "supplier":
        return "Batch Code (Supplier)";
      case "manufacturer":
        return "Batch Code (Manufacturer)";
      case "brand":
        return "Batch Code (Brand)";
    }
  }, [level]);

  const parentLabel = useMemo(() => {
    switch (level) {
      case "supplier":
        return "Parent Batch Code (Farm)";
      case "manufacturer":
        return "Parent Batch Code (Supplier)";
      case "brand":
        return "Parent Batch Code (Manufacturer)";
      default:
        return "";
    }
  }, [level]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await getBatches(level, tenant?.id);
      let items = Array.isArray(res) ? res : (res as any)?.items ?? [];
      if (level !== "farm") {
        items = items.filter((r: any) => r.status === "READY_FOR_NEXT_LEVEL");
      }
      setRows(items);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast({
        title: "Error",
        description:
          err?.response?.data?.detail || `Failed to load ${level} batches`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ fetchMaterials dùng service chuẩn
  const fetchMaterials = async () => {
    if (!tenant?.id) return;
    try {
      const data = await getMaterials(tenant.id);
      console.log("✅ Materials fetched:", data);
      setMaterials(Array.isArray(data) ? data : []);
      if (!data.length) {
        console.warn("⚠️ No materials found for tenant:", tenant.id);
      }
    } catch (err) {
      console.error("❌ Failed to fetch materials:", err);
      setMaterials([]);
    }
  };

  const fetchParentOptions = async () => {
    if (!parentLevel) {
      setParentOptions([]);
      return;
    }
    try {
      const res = await getBatches(parentLevel, tenant?.id);
      const items: RowBatch[] = Array.isArray(res)
        ? res
        : (res as any)?.items ?? [];
      const parentCodeField = CODE_FIELD_BY_LEVEL[parentLevel];
      const options = (items || []).map((r) => ({
        value: r.id as number,
        label: (r[parentCodeField] as string) || r.code || `#${r.id}`,
        code: (r[parentCodeField] as string) || "",
      }));
      setParentOptions(options);
    } catch (e) {
      console.error("Load parent options failed:", e);
      setParentOptions([]);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchParentOptions();
    fetchMaterials();
  }, [level, tenant?.id]);

  useEffect(() => {
    if (openAdd || openEdit) {
      fetchMaterials();
    }
  }, [openAdd, openEdit]);

  useEffect(() => {
    if (tenant?.id) {
      console.log("✅ Tenant ready, fetching materials...");
      fetchMaterials();
    }
  }, [tenant?.id]);

  const openAddModal = () => {
    setForm({
      product_code: "",
      unit: "",
      quantity: 0,
      mfg_date: "",
      country: "VN",
      status: "active",
      material_type: "",
      description: "",
      current_code: "",
      parent_id: "",
      parent_code_display: "",
    });
    fetchMaterials();
    setOpenAdd(true);
  };

  const openEditModal = (row: RowBatch) => {
    const parentIdField = PARENT_ID_FIELD_BY_LEVEL[level];
    const currentCodeField = CODE_FIELD_BY_LEVEL[level];
    setEditData(row);
    setForm({
      product_code: row.product_code || "",
      unit: row.unit || "",
      quantity: row.quantity ?? 0,
      mfg_date: (row as any).mfg_date || "",
      country: (row as any).country || "VN",
      status: (row as any).status || "active",
      material_type: (row as any).material_type || "",
      description: (row as any).description || "",
      current_code: (row as any)[currentCodeField] || row.code || "",
      parent_id:
        parentIdField && (row as any)[parentIdField]
          ? String((row as any)[parentIdField])
          : "",
      parent_code_display:
        parentCodeField && (row as any)[parentCodeField]
          ? String((row as any)[parentCodeField])
          : "",
    });
    setOpenEdit(true);
  };

  const handleAdd = async () => {
    if (savingAdd) return;
    if (!form.current_code.trim() || !form.product_code.trim()) {
      toast({
        title: "Validation error",
        description: "Please fill batch code and product code",
        variant: "destructive",
      });
      return;
    }
    try {
      setSavingAdd(true);
      const payload: any = {
        code: form.current_code.trim(),
        product_code: form.product_code.trim(),
        tenant_id: tenant?.id,
        mfg_date: form.mfg_date || undefined,
        country: form.country || undefined,
        status: form.status || undefined,
        material_type: form.material_type || undefined,
        description: form.description || undefined,
        quantity: form.quantity || undefined,
        unit: form.unit || undefined,
      };
      const parentIdField = PARENT_ID_FIELD_BY_LEVEL[level];
      if (parentIdField) {
        payload[parentIdField] = form.parent_id
          ? Number(form.parent_id)
          : undefined;
      }
      await createBatch(payload as BatchCreate);
      setOpenAdd(false);
      await fetchRows();
      toast({ title: "Success", description: "Batch created successfully" });
    } catch (e: any) {
      console.error("Create failed:", e);
      toast({
        title: "Create failed",
        description: e?.response?.data?.detail || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setSavingAdd(false);
    }
  };

  const handleSaveEdit = async () => {
    if (savingEdit || !editData?.id) return;
    try {
      setSavingEdit(true);
      const payload: any = {
        product_code: form.product_code,
        mfg_date: form.mfg_date || undefined,
        country: form.country || undefined,
        status: form.status || undefined,
        material_type: form.material_type || undefined,
        description: form.description || undefined,
        quantity: form.quantity || undefined,
        unit: form.unit || undefined,
      };
      await updateBatch(editData.id!, payload);
      setOpenEdit(false);
      await fetchRows();
      toast({ title: "Updated", description: "Batch updated successfully" });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.response?.data?.detail || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      await deleteBatch(id);
      await fetchRows();
      toast({ title: "Deleted", description: "Batch deleted successfully" });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.detail || "Unexpected error",
        variant: "destructive",
      });
    }
  };

  const onChangeParent = (val: string) => {
    const found = parentOptions.find((o) => String(o.value) === String(val));
    setForm((f) => ({
      ...f,
      parent_id: val,
      parent_code_display: found?.code || "",
    }));
  };

  const renderStatusTag = (status?: string) => {
    if (status === "READY_FOR_NEXT_LEVEL")
      return <Tag color="green">READY_FOR_NEXT_LEVEL</Tag>;
    if (status === "CLOSED") return <Tag color="red">CLOSED</Tag>;
    return <Tag color="blue">{status || "OPEN"}</Tag>;
  };

  const parentCodeField = PARENT_CODE_FIELD_BY_LEVEL[level];

/// ✅ Lấy role đúng từ auth
const userRole = String(
  auth?.user?.role ?? auth?.role ?? auth?.profile?.role ?? ""
).toLowerCase();

// ✅ Cho phép override cho admin/superadmin/useradmin
const adminOverride = ["admin", "superadmin", "useradmin"].includes(userRole);

console.log("🔎 Current userRole:", userRole, "adminOverride:", adminOverride);


  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{TITLE_BY_LEVEL[level]}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchRows}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-md">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Product</th>
                  {parentCodeField && <th className="border p-2">Parent</th>}
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Country</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Unit</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(rows || []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={parentCodeField ? 8 : 7}
                      className="text-center p-4 text-gray-400"
                    >
                      No data
                    </td>
                  </tr>
                ) : (
                  rows.map((r: any) => {
                    const statusLocked =
  r.status === "READY_FOR_NEXT_LEVEL" ||
  r.status === "CLOSED";
// ✅ Admin/SuperAdmin/UserAdmin được phép override
const isLocked = statusLocked && !adminOverride;

                    return (
                      <tr key={r.id}>
                        <td className="border p-2">{r.code}</td>
                        <td className="border p-2">{r.product_code}</td>
                        {parentCodeField && (
                          <td className="border p-2">
                            {r[parentCodeField] || "-"}
                          </td>
                        )}
                        <td className="border p-2">
                          {renderStatusTag(r.status)}
                        </td>
                        <td className="border p-2">{r.country || "-"}</td>
                        <td className="border p-2">{r.quantity ?? "-"}</td>
                        <td className="border p-2">{r.unit || "-"}</td>
                        <td className="border p-2 text-center">
                          <button
                            className={`${
                              isLocked
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-blue-600 hover:underline"
                            } mr-2`}
                            onClick={() => !isLocked && openEditModal(r)}
                            disabled={isLocked}
                          >
                            <Edit className="w-4 h-4 inline" /> Edit
                          </button>
                          <button
                            className={`${
                              isLocked
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:underline"
                            }`}
                            onClick={() => !isLocked && r.id && handleDelete(r.id)}
                            disabled={isLocked}
                          >
                            <Trash2 className="w-4 h-4 inline" /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* =============== ADD MODAL =============== */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>{currentCodeLabel}</Label>
              <Input
                value={form.current_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, current_code: e.target.value }))
                }
                placeholder="Enter batch code"
              />
            </div>
            <div>
              <Label>Product Code</Label>
              <Input
                value={form.product_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product_code: e.target.value }))
                }
                placeholder="Enter product code"
              />
            </div>
            {parentLevel && (
              <div>
                <Label>{parentLabel}</Label>
                <select
                  className="w-full border rounded p-2"
                  value={form.parent_id}
                  onChange={(e) => onChangeParent(e.target.value)}
                >
                  <option value="">Select parent...</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quantity: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="kg / pcs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Manufacture Date</Label>
                <Input
                  type="date"
                  value={form.mfg_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mfg_date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Material Type</Label>
              <select
  className="border rounded p-2 w-full"
  value={form.material_type}
  onChange={(e) => setForm((f) => ({ ...f, material_type: e.target.value }))}
>
  <option value="">Select...</option>
  {materials.map((m) => (
    <option key={m.id} value={m.name}>
      {m.name}
    </option>
  ))}
</select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={savingAdd}>
              {savingAdd ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =============== EDIT MODAL =============== */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>{currentCodeLabel}</Label>
              <Input
                value={form.current_code}
                disabled
                placeholder="Batch code"
              />
            </div>
            <div>
              <Label>Product Code</Label>
              <Input
                value={form.product_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product_code: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quantity: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Manufacture Date</Label>
                <Input
                  type="date"
                  value={form.mfg_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mfg_date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="w-full border rounded p-2"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="active">Active</option>
                <option value="READY_FOR_NEXT_LEVEL">
                  READY_FOR_NEXT_LEVEL
                </option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div>
              <Label>Material Type</Label>
              <select
                className="w-full border rounded p-2"
                value={form.material_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, material_type: e.target.value }))
                }
              >
                <option value="">Select...</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== LINKS TAB =====================
const BatchLinks: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [parentId, setParentId] = useState<number | null>(null);
  const [childId, setChildId] = useState<number | null>(null);
  const [materialUsed, setMaterialUsed] = useState<number>(0);
  const [chain, setChain] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBatches = async () => {
    const res = await api().get("/api/batches/");
    setBatches(res.data.items || []);
  };

  const createLink = async () => {
    if (!parentId || !childId || parentId === childId) {
      alert("Please select valid parent and child batches.");
      return;
    }
    try {
      setLoading(true);
      await api().post("/api/batch-links/", {
        parent_batch_id: parentId,
        child_batch_id: childId,
        material_used: materialUsed,
      });
      alert("Link created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create link.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChain = async (batchId: number) => {
    const res = await api().get(`/api/batch-links/chain/${batchId}`);
    setChain(res.data.chain);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Parent Batch</Label>
              <select
                className="w-full border rounded p-2"
                value={parentId ?? ""}
                onChange={(e) => setParentId(Number(e.target.value))}
              >
                <option value="">Select...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Child Batch</Label>
              <select
                className="w-full border rounded p-2"
                value={childId ?? ""}
                onChange={(e) => setChildId(Number(e.target.value))}
              >
                <option value="">Select...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Material Used</Label>
              <Input
                type="number"
                value={materialUsed}
                onChange={(e) => setMaterialUsed(Number(e.target.value))}
              />
            </div>
          </div>
          <Button onClick={createLink} disabled={loading}>
            {loading ? "Creating..." : "Create Link"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traceability Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <select
              className="border p-2 rounded"
              onChange={(e) => fetchChain(Number(e.target.value))}
            >
              <option value="">Select batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            {chain.length === 0 ? (
              <p className="text-gray-500">No chain data</p>
            ) : (
              <ul className="space-y-2">
                {chain.map((c, i) => (
                  <li key={i}>
                    {c.level} → {c.batch_code}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
