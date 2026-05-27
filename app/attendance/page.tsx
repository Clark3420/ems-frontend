"use client";

import { useEffect, useState } from "react";
import {
  getAttendance,
  getEmployees,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  AttendanceRecord,
} from "@/lib/api";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/export";
import TableSkeleton from "@/components/TableSkeleton";
import ConfirmModal from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";

type Employee = { id: number; name: string; position: string };

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = ["present", "absent", "late", "half-day"];

const STATUS_STYLES: Record<string, string> = {
  present: "bg-green-50 text-green-700",
  absent: "bg-red-50 text-red-600",
  late: "bg-yellow-50 text-yellow-700",
  "half-day": "bg-blue-50 text-blue-600",
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [status, setStatus] = useState("present");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  useEffect(() => {
    // Filter records by status
    if (statusFilter === "all") {
      setFilteredRecords(records);
    } else {
      setFilteredRecords(records.filter((r) => r.status === statusFilter));
    }
    setCurrentPage(1);
  }, [statusFilter, records]);

  async function loadEmployees() {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    }
  }

  async function loadAttendance() {
    setLoading(true);
    try {
      const data = await getAttendance(selectedDate);
      setRecords(data);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingRecord(null);
    setEmployeeId("");
    setStatus("present");
    setClockIn("");
    setClockOut("");
    setIsModalOpen(true);
  }

  function openEditModal(record: AttendanceRecord) {
    setEditingRecord(record);
    setEmployeeId(record.employee_id);
    setStatus(record.status);
    setClockIn(record.clock_in ?? "");
    setClockOut(record.clock_out ?? "");
    setIsModalOpen(true);
  }

  async function saveAttendance() {
    if (!employeeId) {
      toast.error("Please select an employee");
      return;
    }
    try {
      if (editingRecord) {
        const updated = await updateAttendance(editingRecord.id, {
          status,
          clock_in: clockIn || null,
          clock_out: clockOut || null,
        });
        setRecords(records.map((r) => (r.id === editingRecord.id ? updated : r)));
        toast.success("Attendance updated");
      } else {
        const newRecord = await createAttendance({
          employee_id: Number(employeeId),
          date: selectedDate,
          status,
          clock_in: clockIn || null,
          clock_out: clockOut || null,
        });
        setRecords([...records, newRecord]);
        toast.success("Attendance recorded");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this attendance record?")) return;
    try {
      await deleteAttendance(id);
      setRecords(records.filter((r) => r.id !== id));
      toast.success("Record deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  function handleExport() {
  const exportData = filteredRecords.map((rec) => ({
    Date: rec.date,
    Employee: rec.employee.name,
    Position: rec.employee.position,
    Status: rec.status,
    "Clock In": rec.clock_in ?? "—",
    "Clock Out": rec.clock_out ?? "—",
  }));
  exportToExcel(exportData, `Attendance_${selectedDate}`, "Attendance");
  toast.success("Exported to Excel");
}

  // Summary counts
  const summary = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = records.filter((r) => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const paginatedRecords = filteredRecords.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

  return (
    <div>
     {/* Header */}
<div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
    <p className="text-sm text-gray-500 mt-0.5">
      {filteredRecords.length} of {records.length} records for {selectedDate}
    </p>
  </div>
  <div className="flex gap-2">
    <button
      onClick={handleExport}
      disabled={filteredRecords.length === 0}
      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
    >
      📥 Export to Excel
    </button>
    <button
      onClick={openAddModal}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
    >
      + Record Attendance
    </button>
  </div>
</div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Present", key: "present", color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Absent", key: "absent", color: "bg-red-50 text-red-600 border-red-100" },
          { label: "Late", key: "late", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
          { label: "Half-day", key: "half-day", color: "bg-blue-50 text-blue-600 border-blue-100" },
        ].map((card) => (
          <div key={card.key} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{summary[card.key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half-day">Half-day</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
          {statusFilter !== "all"
            ? `No ${statusFilter} records for this date.`
            : "No attendance records for this date. Click + Record Attendance to add one."}
        </div>
      ) : (
      <>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto"> 
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clock In</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clock Out</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{rec.employee.name}</td>
                  <td className="px-6 py-4 text-gray-500">{rec.employee.position}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[rec.status]}`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{rec.clock_in ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{rec.clock_out ?? "—"}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmModal({ open: true, id: rec.id })}
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
          totalItems={filteredRecords.length}
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
              {editingRecord ? "Edit Attendance" : "Record Attendance"}
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

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>

              {/* Clock In */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Clock In</label>
                <input
                  type="time" 
                  value={clockIn}
                  onChange={(e) => setClockIn(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clock Out */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Clock Out</label>
                <input
                  type="time"
                  value={clockOut}
                  onChange={(e) => setClockOut(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onClick={saveAttendance}
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
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record?"
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => confirmModal.id && handleDelete(confirmModal.id)}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </div>
  );
}