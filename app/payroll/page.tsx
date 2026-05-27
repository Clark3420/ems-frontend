"use client";

import { useEffect, useState } from "react";
import {
  getPayrolls,
  getEmployees,
  createPayroll,
  updatePayroll,
  deletePayroll,
  markPayrollPaid,
  PayrollRecord,
} from "@/lib/api";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/export";
import TableSkeleton from "@/components/TableSkeleton";
import ConfirmModal from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";

type Employee = { id: number; name: string; position: string };

const ITEMS_PER_PAGE = 10;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  paid: "bg-green-50 text-green-700",
};

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);

  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [tax, setTax] = useState("0");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const netPay =
    (parseFloat(basicSalary) || 0) +
    (parseFloat(allowances) || 0) -
    (parseFloat(deductions) || 0) -
    (parseFloat(tax) || 0);

  useEffect(() => {
    loadEmployees();
    loadPayrolls();
  }, []);

  useEffect(() => {
    // Filter payrolls by status and employee
    let filtered = payrolls;

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (employeeFilter !== "all") {
      filtered = filtered.filter((p) => p.employee_id === Number(employeeFilter));
    }

    setFilteredPayrolls(filtered);
  }, [statusFilter, employeeFilter, payrolls]);

  async function loadEmployees() {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    }
  }

  async function loadPayrolls() {
    setLoading(true);
    try {
      const data = await getPayrolls();
      setPayrolls(data);
    } catch {
      toast.error("Failed to load payroll");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingRecord(null);
    setEmployeeId("");
    setPeriodStart("");
    setPeriodEnd("");
    setBasicSalary("");
    setAllowances("0");
    setDeductions("0");
    setTax("0");
    setIsModalOpen(true);
  }

  function openEditModal(record: PayrollRecord) {
    setEditingRecord(record);
    setEmployeeId(record.employee_id);
    setPeriodStart(record.period_start);
    setPeriodEnd(record.period_end);
    setBasicSalary(String(record.basic_salary));
    setAllowances(String(record.allowances));
    setDeductions(String(record.deductions));
    setTax(String(record.tax));
    setIsModalOpen(true);
  }

  async function savePayroll() {
    if (!employeeId || !periodStart || !periodEnd || !basicSalary) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (editingRecord) {
        const updated = await updatePayroll(editingRecord.id, {
          basic_salary: parseFloat(basicSalary),
          allowances: parseFloat(allowances),
          deductions: parseFloat(deductions),
          tax: parseFloat(tax),
        });
        setPayrolls(payrolls.map((p) => (p.id === editingRecord.id ? updated : p)));
        toast.success("Payroll updated");
      } else {
        const newRecord = await createPayroll({
          employee_id: Number(employeeId),
          period_start: periodStart,
          period_end: periodEnd,
          basic_salary: parseFloat(basicSalary),
          allowances: parseFloat(allowances),
          deductions: parseFloat(deductions),
          tax: parseFloat(tax),
        });
        setPayrolls([...payrolls, newRecord]);
        toast.success("Payroll created");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this payroll record?")) return;
    try {
      await deletePayroll(id);
      setPayrolls(payrolls.filter((p) => p.id !== id));
      toast.success("Payroll record deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  async function handleMarkPaid(id: number) {
    try {
      const updated = await markPayrollPaid(id);
      setPayrolls(payrolls.map((p) => (p.id === id ? updated : p)));
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to update status");
    }
  }

  function handleExport() {
  const exportData = filteredPayrolls.map((p) => ({
    Employee: p.employee.name,
    Position: p.employee.position,
    "Period Start": p.period_start,
    "Period End": p.period_end,
    "Basic Salary": Number(p.basic_salary),
    Allowances: Number(p.allowances),
    Deductions: Number(p.deductions),
    Tax: Number(p.tax),
    "Net Pay": Number(p.net_pay),
    Status: p.status,
  }));
  exportToExcel(exportData, `Payroll_${new Date().toISOString().split("T")[0]}`, "Payroll");
  toast.success("Exported to Excel");
}

  const totalNetPay = filteredPayrolls.reduce((sum, p) => sum + Number(p.net_pay), 0);
  const totalPaid = payrolls.filter((p) => p.status === "paid").length;
  const totalPending = payrolls.filter((p) => p.status === "pending").length;

  const paginatedPayrolls = filteredPayrolls.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

  return (
    <div>
      {/* Header */}
<div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
    <p className="text-sm text-gray-500 mt-0.5">
      {filteredPayrolls.length} of {payrolls.length} records
    </p>
  </div>
  <div className="flex gap-2">
    <button
      onClick={handleExport}
      disabled={filteredPayrolls.length === 0}
      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
    >
      📥 Export to Excel
    </button>
    <button
      onClick={openAddModal}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
    >
      + Add Payroll
    </button>
  </div>
</div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Net Pay</p>
          <p className="text-2xl font-bold text-gray-800">
            ₱{totalNetPay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="text-xs text-green-700 uppercase tracking-wide mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-700">{totalPaid}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
          <p className="text-xs text-yellow-700 uppercase tracking-wide mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{totalPending}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={9} />
      ) : filteredPayrolls.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
          {statusFilter !== "all" || employeeFilter !== "all"
            ? "No payroll records match your filters."
            : "No payroll records yet. Click + Add Payroll to get started."}
        </div>
      ) : (
        <>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Basic</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Allowances</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deductions</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Pay</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayrolls.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{p.employee.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{p.period_start} → {p.period_end}</td>
                  <td className="px-6 py-4 text-gray-600">₱{Number(p.basic_salary).toLocaleString()}</td>
                  <td className="px-6 py-4 text-green-600">+₱{Number(p.allowances).toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-500">-₱{Number(p.deductions).toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-500">-₱{Number(p.tax).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">₱{Number(p.net_pay).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {p.status === "pending" && (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmModal({ open: true, id: p.id })}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
      currentPage={currentPage}
      totalItems={filteredPayrolls.length}
      itemsPerPage={ITEMS_PER_PAGE}
      onPageChange={setCurrentPage}
      />
      </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {editingRecord ? "Edit Payroll" : "Add Payroll"}
            </h3>

            <div className="space-y-3 mb-5">
              {/* Employee */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(Number(e.target.value))}
                  disabled={!!editingRecord}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    disabled={!!editingRecord}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    disabled={!!editingRecord}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Salary fields */}
              {[
                { label: "Basic Salary", value: basicSalary, setter: setBasicSalary },
                { label: "Allowances", value: allowances, setter: setAllowances },
                { label: "Deductions", value: deductions, setter: setDeductions },
                { label: "Tax", value: tax, setter: setTax },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              {/* Net Pay Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Net Pay</span>
                <span className="text-lg font-bold text-gray-800">
                  ₱{netPay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
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
                onClick={savePayroll}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {editingRecord ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Delete Payroll Record"
        message="Are you sure you want to delete this payroll record?"
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => confirmModal.id && handleDelete(confirmModal.id)}
        onCancel={() => setConfirmModal({ open: false, id: null })}
    />
    </div>
  );
}