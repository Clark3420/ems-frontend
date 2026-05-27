"use client";

import { useEffect, useState } from "react";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, Department } from "@/lib/api";
import toast from "react-hot-toast";
import TableSkeleton from "@/components/TableSkeleton";
import ConfirmModal from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingDept(null);
    setName("");
    setDescription("");
    setIsModalOpen(true);
  }

  function openEditModal(dept: Department) {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setIsModalOpen(true);
  }

  async function saveDepartment() {
    if (!name) {
      toast.error("Please enter department name");
      return;
    }
    try {
      if (editingDept) {
        const updated = await updateDepartment(editingDept.id, { name, description });
        setDepartments(departments.map((d) => (d.id === editingDept.id ? updated : d)));
        toast.success("Department updated");
      } else {
        const newDept = await createDepartment({ name, description });
        setDepartments([...departments, newDept]);
        toast.success("Department created");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

async function handleDelete(id: number) {
  try {
    await deleteDepartment(id);
    setDepartments(departments.filter((d) => d.id !== id));
    toast.success("Department deleted");
  } catch {
    toast.error("Delete failed");
  } finally {
    setConfirmModal({ open: false, id: null });
  }
}

const paginatedDepartments = departments.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{departments.length} total departments</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Department
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : departments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
          No departments yet. Click <span className="font-medium text-blue-600">+ Add Department</span> to get started.
        </div>
      ) : (
      <>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDepartments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{dept.name}</td>
                  <td className="px-6 py-4 text-gray-500">{dept.description || "—"}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmModal({ open: true, id: dept.id })}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={departments.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {editingDept ? "Edit Department" : "Add Department"}
            </h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={saveDepartment}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {editingDept ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Delete Department"
        message="Are you sure you want to delete this department? Employees assigned to it will become unassigned."
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => confirmModal.id && handleDelete(confirmModal.id)}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </div>
  );
}