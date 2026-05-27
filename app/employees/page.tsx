"use client";

import { useEffect, useState } from "react";
import { getEmployees, addEmployee, deleteEmployee, updateEmployee, getDepartments, Department } from "@/lib/api";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/export";
import { useRouter } from "next/navigation";
import TableSkeleton from "@/components/TableSkeleton";
import ConfirmModal from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";

type Employee = {
  id: number;
  name: string;
  position: string;
  email?: string | null;
  department_id?: number | null;
  department?: { id: number; name: string } | null;
};

const ITEMS_PER_PAGE = 10;

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<number | "all">("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const router = useRouter();

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  useEffect(() => {
    let filtered = employees;
    if (searchQuery) {
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department_id === departmentFilter);
    }
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, employees]);

  async function loadEmployees() {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function loadDepartments() {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch {
      console.error("Failed to load departments");
    }
  }

  function openAddModal() {
    setEditingId(null);
    setName("");
    setPosition("");
    setEmail("");
    setDepartmentId("");
    setIsModalOpen(true);
  }

  function openEditModal(emp: Employee) {
    setEditingId(emp.id);
    setName(emp.name);
    setPosition(emp.position);
    setEmail(emp.email || "");
    setDepartmentId(emp.department_id || "");
    setIsModalOpen(true);
  }

  async function saveEmployee() {
    if (!name || !position) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      if (editingId) {
        const updated = await updateEmployee(editingId, {
          name, position,
          email: email || null,
          department_id: departmentId ? Number(departmentId) : null,
        });
        setEmployees(employees.map((emp) => (emp.id === editingId ? updated : emp)));
        toast.success("Employee updated");
      } else {
        const newEmp = await addEmployee({
          name, position,
          email: email || null,
          department_id: departmentId ? Number(departmentId) : null,
        });
        setEmployees([...employees, newEmp]);
        toast.success("Employee added");
      }
      setIsModalOpen(false);
      setName("");
      setPosition("");
      setEmail("");
      setEditingId(null);
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEmployee(id);
      setEmployees(employees.filter((e) => e.id !== id));
      toast.success("Employee deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmModal({ open: false, id: null });
    }
  }

  function handleExport() {
    const exportData = filteredEmployees.map((emp) => ({
      ID: emp.id,
      Name: emp.name,
      Position: emp.position,
      Email: emp.email || "—",
      Department: emp.department?.name || "—",
    }));
    exportToExcel(exportData, `Employees_${new Date().toISOString().split("T")[0]}`, "Employees");
    toast.success("Exported to Excel");
  }

  // Pagination
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={filteredEmployees.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            📥 Export
          </button>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
          {searchQuery || departmentFilter !== "all"
            ? "No employees match your filters."
            : "No employees yet. Click + Add Employee to get started."}
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">{emp.name}</td>
                      <td className="px-6 py-4 text-gray-500">{emp.position}</td>
                      <td className="px-6 py-4 text-gray-500">{emp.email || "—"}</td>
                      <td className="px-6 py-4 text-gray-500">{emp.department?.name || "—"}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => router.push(`/employees/${emp.id}`)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmModal({ open: true, id: emp.id })}
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
            totalItems={filteredEmployees.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {editingId ? "Edit Employee" : "Add Employee"}
            </h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Juan dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. juan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Department <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
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
                onClick={saveEmployee}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {editingId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => confirmModal.id && handleDelete(confirmModal.id)}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </div>
  );
}