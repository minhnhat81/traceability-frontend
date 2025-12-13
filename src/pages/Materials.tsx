import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  Material,
} from "../services/materialService";

const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Material>({
    tenant_id: 1,
    name: "",
    scientific_name: "",
    stages: "",
    dpp_notes: "",
  });

  const tenant_id = 1;

  const loadMaterials = async () => {
    const data = await getMaterials(tenant_id);
    setMaterials(data);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const openModal = (mat?: Material, readonly = false) => {
    if (mat) {
      setForm({
        tenant_id: mat.tenant_id,
        name: mat.name,
        scientific_name: mat.scientific_name,
        stages: Array.isArray(mat.stages) ? mat.stages.join(", ") : mat.stages ?? "",
        dpp_notes: mat.dpp_notes,
      });
      setEditingId(mat.id ?? null);
      setViewMode(readonly);
    } else {
      setForm({ tenant_id, name: "", scientific_name: "", stages: "", dpp_notes: "" });
      setEditingId(null);
      setViewMode(false);
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      stages:
        typeof form.stages === "string"
          ? form.stages.split(",").map((s) => s.trim())
          : form.stages,
    };

    if (editingId) {
      await updateMaterial(editingId, payload, tenant_id);
    } else {
      await createMaterial(payload);
    }
    setOpen(false);
    loadMaterials();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      await deleteMaterial(id, tenant_id);
      loadMaterials();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Material Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Material
        </button>
      </div>

      <table className="w-full bg-white shadow rounded-2xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Scientific Name / Source</th>
            <th className="p-2 text-left">Certifications / Notes</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((mat) => (
            <tr key={mat.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{mat.name}</td>
              <td className="p-2">{mat.scientific_name}</td>
              <td className="p-2">{mat.dpp_notes}</td>
              <td className="p-2 text-center space-x-3">
                <button
                  onClick={() => openModal(mat, true)}
                  className="text-green-600 hover:underline"
                >
                  View
                </button>
                <button
                  onClick={() => openModal(mat)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(mat.id!)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <Dialog.Title className="text-lg font-semibold mb-4">
              {viewMode
                ? "View Material"
                : editingId
                ? "Edit Material"
                : "Add Material"}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="border p-2 w-full rounded"
                placeholder="Material name"
                value={form.name}
                disabled={viewMode}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="border p-2 w-full rounded"
                placeholder="Scientific name / source"
                value={form.scientific_name}
                disabled={viewMode}
                onChange={(e) =>
                  setForm({ ...form, scientific_name: e.target.value })
                }
              />
              <textarea
                className="border p-2 w-full rounded"
                placeholder="Production stages (comma separated)"
                value={form.stages as string}
                disabled={viewMode}
                onChange={(e) => setForm({ ...form, stages: e.target.value })}
              />
              <input
                className="border p-2 w-full rounded"
                placeholder="Certifications or notes"
                value={form.dpp_notes}
                disabled={viewMode}
                onChange={(e) => setForm({ ...form, dpp_notes: e.target.value })}
              />

              {!viewMode && (
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {editingId ? "Update" : "Create"}
                  </button>
                </div>
              )}

              {viewMode && (
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              )}
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Materials;
