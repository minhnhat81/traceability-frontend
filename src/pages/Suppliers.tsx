import React, { useEffect, useMemo, useState } from "react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/services/suppliersService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { RefreshCw, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Supplier = {
  id?: number;
  code?: string;
  name?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  factory_location?: string;
  country?: string;
  certification?: any;
  user_id?: number | string | null;
};

export default function Suppliers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<Supplier>({
    code: "",
    name: "",
    contact_email: "",
    phone: "",
    address: "",
    factory_location: "",
    country: "VN",
    certification: {},
    user_id: "",
  });
  const [certificationText, setCertificationText] = useState<string>("{}");

  // -------- utils ----------
  const safeParse = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  };

  const buildPayload = () => {
    const certObj = safeParse(certificationText);
    if (certObj === undefined) {
      throw new Error("CERT_JSON");
    }

    let userId: number | undefined;
    if (form.user_id !== "" && form.user_id !== null && form.user_id !== undefined) {
      const n = Number(form.user_id);
      if (Number.isNaN(n)) throw new Error("USER_ID");
      userId = n;
    }

    const payload: any = {
      code: form.code?.trim() || "",
      name: form.name?.trim() || "",
      country: (form.country?.trim() || "VN"),
      certification: certObj,
    };

    // optional fields – chỉ thêm nếu có giá trị
    if (form.contact_email?.trim()) payload.contact_email = form.contact_email.trim();
    if (form.phone?.trim()) payload.phone = form.phone.trim();
    if (form.address?.trim()) payload.address = form.address.trim();
    if (form.factory_location?.trim()) payload.factory_location = form.factory_location.trim();
    if (userId !== undefined) payload.user_id = userId;

    if (!payload.code || !payload.name) {
      throw new Error("REQUIRED");
    }

    return payload;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setRows(list || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------- open modals ----------
  const openAddModal = () => {
    setEditId(null);
    setForm({
      code: "",
      name: "",
      contact_email: "",
      phone: "",
      address: "",
      factory_location: "",
      country: "VN",
      certification: {},
      user_id: "",
    });
    setCertificationText("{}");
    setOpenAdd(true);
  };

  const openEditModal = (r: Supplier) => {
    setEditId(r.id || null);
    setForm({
      ...r,
      user_id: r.user_id ?? "",
      certification: r.certification ?? {},
    });
    setCertificationText(JSON.stringify(r.certification ?? {}, null, 2));
    setOpenEdit(true);
  };

  // -------- CRUD ----------
  const handleAdd = async () => {
    try {
      const payload = buildPayload();
      await createSupplier(payload);
      setOpenAdd(false);
      await fetchData();
      toast({ title: "Created", description: "Supplier added successfully" });
    } catch (e: any) {
      const code = e?.message;
      let msg = "Failed to add supplier";
      if (code === "CERT_JSON") msg = "Certification must be valid JSON object.";
      if (code === "USER_ID") msg = "USER_ID must be a number.";
      if (code === "REQUIRED") msg = "CODE and NAME are required.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!editId) return;
    try {
      const payload = buildPayload();
      await updateSupplier(editId, payload);
      setOpenEdit(false);
      await fetchData();
      toast({ title: "Updated", description: "Supplier updated successfully" });
    } catch (e: any) {
      const code = e?.message;
      let msg = "Failed to update supplier";
      if (code === "CERT_JSON") msg = "Certification must be valid JSON object.";
      if (code === "USER_ID") msg = "USER_ID must be a number.";
      if (code === "REQUIRED") msg = "CODE and NAME are required.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Delete this supplier?")) return;
    try {
      await deleteSupplier(id);
      await fetchData();
      toast({ title: "Deleted", description: "Supplier deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete supplier", variant: "destructive" });
    }
  };

  // -------- render helpers ----------
  const renderCertificationTable = (data: any) => {
    if (!data || typeof data !== "object") return <span className="text-gray-400">-</span>;
    const entries = Object.entries<any>(data);
    if (entries.length === 0) return <span className="text-gray-400">-</span>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-[420px] text-xs border rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 text-left">Scheme</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">Cert No</th>
              <th className="border px-2 py-1 text-left">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([scheme, v]) => {
              const row = typeof v === "object" && v ? v : {};
              return (
                <tr key={scheme}>
                  <td className="border px-2 py-1 font-medium">{scheme}</td>
                  <td className="border px-2 py-1">{row.status ?? "-"}</td>
                  <td className="border px-2 py-1">{row.cert_no ?? "-"}</td>
                  <td className="border px-2 py-1">{row.expiry_date ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="p-4 text-center text-gray-500">
            Loading...
          </td>
        </tr>
      );
    }
    if (!rows || rows.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="p-4 text-center text-gray-400">
            No data
          </td>
        </tr>
      );
    }
    return rows.map((r) => (
      <tr key={r.id}>
        <td className="border p-2">{r.code}</td>
        <td className="border p-2">{r.name}</td>
        <td className="border p-2">{r.factory_location}</td>
        <td className="border p-2 align-top">{renderCertificationTable(r.certification)}</td>
        <td className="border p-2">{r.contact_email}</td>
        <td className="border p-2">{r.user_id ?? "-"}</td>
        <td className="border p-2 text-center">
          <button
            className="text-blue-600 hover:underline mr-2"
            onClick={() => openEditModal(r)}
          >
            <Edit className="w-4 h-4 inline" /> Edit
          </button>
          <button
            className="text-red-600 hover:underline"
            onClick={() => handleDelete(r.id)}
          >
            <Trash2 className="w-4 h-4 inline" /> Delete
          </button>
        </td>
      </tr>
    ));
  }, [rows, loading]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Supplier Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <table className="w-full text-sm border rounded-md">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="border p-2">Code</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Factory</th>
              <th className="border p-2">Certification</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">User</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </Card>

      {/* ADD */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent
          className="
            fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            w-[90vw] max-w-[1100px] h-[85vh]
            bg-white rounded-lg shadow-lg
            flex flex-col overflow-hidden
          "
        >
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Add Supplier</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 md:col-span-6 space-y-3">
                <div><Label>CODE</Label><Input value={form.code || ""} onChange={(e)=>setForm({...form, code:e.target.value})}/></div>
                <div><Label>NAME</Label><Input value={form.name || ""} onChange={(e)=>setForm({...form, name:e.target.value})}/></div>
                <div><Label>CONTACT_EMAIL</Label><Input value={form.contact_email || ""} onChange={(e)=>setForm({...form, contact_email:e.target.value})}/></div>
                <div><Label>PHONE</Label><Input value={form.phone || ""} onChange={(e)=>setForm({...form, phone:e.target.value})}/></div>
                <div><Label>ADDRESS</Label><Input value={form.address || ""} onChange={(e)=>setForm({...form, address:e.target.value})}/></div>
              </div>

              <div className="col-span-12 md:col-span-6 space-y-3">
                <div><Label>FACTORY_LOCATION</Label><Input value={form.factory_location || ""} onChange={(e)=>setForm({...form, factory_location:e.target.value})}/></div>
                <div><Label>COUNTRY</Label><Input value={form.country || ""} onChange={(e)=>setForm({...form, country:e.target.value})}/></div>
                <div><Label>USER_ID</Label><Input value={(form.user_id as any) ?? ""} onChange={(e)=>setForm({...form, user_id:e.target.value})}/></div>
                <div>
                  <Label>Certification (JSON)</Label>
                  <textarea
                    className="w-full border rounded p-2 font-mono text-xs"
                    rows={10}
                    value={certificationText}
                    onChange={(e)=>setCertificationText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-white flex justify-end gap-2 sticky bottom-0">
            <Button variant="outline" onClick={()=>setOpenAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent
          className="
            fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            w-[90vw] max-w-[1100px] h-[85vh]
            bg-white rounded-lg shadow-lg
            flex flex-col overflow-hidden
          "
        >
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 md:col-span-6 space-y-3">
                <div><Label>CODE</Label><Input value={form.code || ""} onChange={(e)=>setForm({...form, code:e.target.value})}/></div>
                <div><Label>NAME</Label><Input value={form.name || ""} onChange={(e)=>setForm({...form, name:e.target.value})}/></div>
                <div><Label>CONTACT_EMAIL</Label><Input value={form.contact_email || ""} onChange={(e)=>setForm({...form, contact_email:e.target.value})}/></div>
                <div><Label>PHONE</Label><Input value={form.phone || ""} onChange={(e)=>setForm({...form, phone:e.target.value})}/></div>
                <div><Label>ADDRESS</Label><Input value={form.address || ""} onChange={(e)=>setForm({...form, address:e.target.value})}/></div>
              </div>

              <div className="col-span-12 md:col-span-6 space-y-3">
                <div><Label>FACTORY_LOCATION</Label><Input value={form.factory_location || ""} onChange={(e)=>setForm({...form, factory_location:e.target.value})}/></div>
                <div><Label>COUNTRY</Label><Input value={form.country || ""} onChange={(e)=>setForm({...form, country:e.target.value})}/></div>
                <div><Label>USER_ID</Label><Input value={(form.user_id as any) ?? ""} onChange={(e)=>setForm({...form, user_id:e.target.value})}/></div>
                <div>
                  <Label>Certification (JSON)</Label>
                  <textarea
                    className="w-full border rounded p-2 font-mono text-xs"
                    rows={10}
                    value={certificationText}
                    onChange={(e)=>setCertificationText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-white flex justify-end gap-2 sticky bottom-0">
            <Button variant="outline" onClick={()=>setOpenEdit(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
