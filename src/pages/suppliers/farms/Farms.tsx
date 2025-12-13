import React, { useState, useEffect } from "react";
import {
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  Farm as FarmType, // ✅ import chung type Farm từ service
} from "@/services/farmService";

// ✅ Sử dụng type từ service, mở rộng thêm cho frontend (vẫn giữ nguyên cấu trúc bạn viết)
export interface Farm extends FarmType {
  status: "active" | "inactive"; // frontend giữ enum rõ ràng
}

/* =========================================================
   Page: Farm list + modal create / edit
========================================================= */
export default function Farms() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [editing, setEditing] = useState<Farm | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFarms();
      // ✅ ép kiểu dữ liệu status nếu backend trả "active"/"inactive"/string khác
      const normalized = (data || []).map((f: any) => ({
        ...f,
        status: f.status === "active" ? "active" : "inactive",
      })) as Farm[];
      setFarms(normalized);
    } catch (e) {
      console.error("load farms error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (payload: Farm) => {
    try {
      if (editing?.id) {
        const updated = await updateFarm(editing.id, payload);
        setFarms((prev) =>
          prev.map((f) => (f.id === editing.id ? { ...updated, status: "active" } : f))
        );
      } else {
        const created = await createFarm(payload);
        setFarms((prev) => [{ ...created, status: "active" }, ...prev]);
      }
      setOpen(false);
      setEditing(null);
    } catch (e) {
      console.error("save farm error:", e);
      alert("Save failed. Check console for details.");
    }
  };

  const onDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Delete this farm?")) return;
    try {
      await deleteFarm(id);
      setFarms((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error("delete farm error:", e);
      alert("Delete failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Farm Management</h2>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded"
        >
          + Add Farm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3 border-b">Name</th>
              <th className="p-3 border-b">Code</th>
              <th className="p-3 border-b">Type</th>
              <th className="p-3 border-b">Location</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              farms.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{f.name}</td>
                  <td className="p-3 border-b">{f.code}</td>
                  <td className="p-3 border-b">{f.farm_type}</td>
                  <td className="p-3 border-b">
                    {[f.location?.district, f.location?.province, f.location?.country]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td className="p-3 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        f.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3 border-b text-center">
                    <button
                      onClick={() => {
                        setEditing(f);
                        setOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(f.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && farms.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No farms available. Click &quot;Add Farm&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <FarmModal
          defaultValues={
            editing ?? {
              name: "",
              code: "",
              gln: "",
              farm_type: "",
              size_ha: null,
              location: {},
              certification: {},
              contact_info: {},
              extra_data: {},
              status: "active",
            }
          }
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={onSave}
        />
      )}
    </div>
  );
}

/* =========================================================
   Modal
========================================================= */
function safeParseJSON<T = any>(s: string): T | undefined {
  if (!s.trim()) return {} as T;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

type ModalProps = {
  defaultValues: Farm;
  onCancel: () => void;
  onSave: (payload: Farm) => void;
};

function FarmModal({ defaultValues, onCancel, onSave }: ModalProps) {
  const [form, setForm] = useState<Farm>({ ...defaultValues });
  const [extraText, setExtraText] = useState(
    JSON.stringify(defaultValues.extra_data ?? {}, null, 2)
  );

  const set = <K extends keyof Farm>(k: K, v: Farm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const setLoc = (k: keyof NonNullable<Farm["location"]>, v: any) =>
    setForm((p) => ({ ...p, location: { ...(p.location ?? {}), [k]: v } }));

  const setCert = (k: keyof NonNullable<Farm["certification"]>, v: any) =>
    setForm((p) => ({
      ...p,
      certification: { ...(p.certification ?? {}), [k]: v },
    }));

  const setContact = (k: keyof NonNullable<Farm["contact_info"]>, v: any) =>
    setForm((p) => ({
      ...p,
      contact_info: { ...(p.contact_info ?? {}), [k]: v },
    }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const extra = safeParseJSON<Record<string, any>>(extraText);
    if (extra === undefined) {
      alert("Extra Data must be valid JSON.");
      return;
    }

    const payload: Farm = {
      ...form,
      size_ha:
        form.size_ha === null || form.size_ha === undefined
          ? null
          : Number(form.size_ha),
      extra_data: extra,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[860px] max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {form.id ? "Edit Farm" : "Add New Farm"}
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-6">
          {/* General */}
          <section>
            <h4 className="font-medium mb-3">General</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Code</label>
                <input
                  value={form.code ?? ""}
                  onChange={(e) => set("code", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">GLN</label>
                <input
                  value={form.gln ?? ""}
                  onChange={(e) => set("gln", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Farm Type</label>
                <input
                  value={form.farm_type ?? ""}
                  onChange={(e) => set("farm_type", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Size (ha)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.size_ha ?? ""}
                  onChange={(e) =>
                    set("size_ha", e.target.value === "" ? null : Number(e.target.value))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              {form.created_at && (
                <div>
                  <label className="text-xs text-gray-500">Created At</label>
                  <input
                    value={new Date(form.created_at).toLocaleString()}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-50"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Location */}
          {/* ... giữ nguyên toàn bộ các section khác ... */}

          <section className="grid grid-cols-3 gap-4 items-start">
            <div className="col-span-1 flex items-center gap-2">
              <input
                id="statusActive"
                type="checkbox"
                checked={form.status === "active"}
                onChange={(e) =>
                  set("status", e.target.checked ? "active" : "inactive")
                }
              />
              <label htmlFor="statusActive">Active</label>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Extra Data (JSON)</label>
              <textarea
                rows={6}
                value={extraText}
                onChange={(e) => setExtraText(e.target.value)}
                className="w-full border p-2 rounded font-mono text-xs"
                placeholder='e.g. {"note":"something"}'
              />
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="border px-4 py-2 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
