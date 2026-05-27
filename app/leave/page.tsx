"use client";

import { useEffect, useState } from "react";
import {
  getLeaves,
  getEmployees,
  createLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
  LeaveRecord,
} from "@/lib/api";
import toast from "react-hot-toast";
import TableSkeleton from "@/components/TableSkeleton";
import ConfirmModal from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";

type Employee = { id: number; name: string; position: string };

const ITEMS_PER_PAGE = 10;

const LEAVE_TYPES = ["sick", "vacation", "personal"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

const TYPE_STYLES: Record<string, string> = {
  sick: "bg-red-50 text-red-600",
  vacation: "bg-blue-50 text-blue-600",
  personal: "bg-purple-50 text-purple-600",
};

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [leaveType, setLeaveType] = useState("sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [confirmApprove, setConfirmApprove] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [confirmReject, setConfirmReject] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  useEffect(() => {
    loadEmployees();
    loadLeaves();
  }, []);

  useEffect(() => {
    let filtered = leaves;
    if (statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((l) => l.leave_type === typeFilter);
    }
    setFilteredLeaves(filtered);
  }, [statusFilter, typeFilter, leaves]);

  async function loadEmployees() {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    }
  }

async function loadLeaves() {
  setLoading(true);
  try {
    const data = await getLeaves();
    // Filter out any records with missing employee data
    setLeaves(data.filter((l: LeaveRecord) => l.employee));
  } catch {
    toast.error("Failed to load leaves");
  } finally {
    setLoading(false);
  }
} 

  function openAddModal() {
    setEmployeeId("");
    setLeaveType("sick");
    setStartDate("");
    setEndDate("");
    setReason("");
    setIsModalOpen(true);
  }

  async function saveLeave() {
    if (!employeeId || !startDate || !endDate) {
      toast.error("Please fill all required fields");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }
    try {
      const newLeave = await createLeave({
        employee_id: Number(employeeId),
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      setLeaves([...leaves, newLeave]);
      toast.success("Leave request created");
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  async function handleApprove(id: number) {
    try {
      const updated = await approveLeave(id);
      setLeaves(leaves.map((l) => (l.id === id ? updated : l)));
      toast.success("Leave approved");
    } catch {
      toast.error("Failed to approve leave");
    }
  }

  async function handleReject(id: number) {
    try {
      const updated = await rejectLeave(id);
      setLeaves(leaves.map((l) => (l.id === id ? updated : l)));
      toast.success("Leave rejected");
    } catch {
      toast.error("Failed to reject leave");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this leave request?")) return;
    try {
      await deleteLeave(id);
      setLeaves(leaves.filter((l) => l.id !== id));
      toast.success("Leave request deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  function getDayCount(start: string, end: string) {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  // Summary counts
  const summary = {
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  const paginatedLeaves = filteredLeaves.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredLeaves.length} of {leaves.length} requests
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + New Leave Request
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
          <p className="text-xs text-yellow-700 uppercase tracking-wide mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-700">{summary.pending}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="text-xs text-green-700 uppercase tracking-wide mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-700">{summary.approved}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{summary.rejected}</p>
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="sick">Sick</option>
            <option value="vacation">Vacation</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : filteredLeaves.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
          {statusFilter !== "all" || typeFilter !== "all"
            ? "No leave requests match your filters."
            : "No leave requests yet. Click + New Leave Request to add one."}
        </div>
      ) : (
        <>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{leave.employee?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{leave.employee?.position ?? ""}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${TYPE_STYLES[leave.leave_type]}`}>
                      {leave.leave_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {leave.start_date} → {leave.end_date}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {getDayCount(leave.start_date, leave.end_date)}d
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                    {leave.reason || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[leave.status]}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {leave.status === "pending" && (
                        <>
                          <button onClick={() => setConfirmApprove({ open: true, id: leave.id })}>Approve</button>
                          <button onClick={() => setConfirmReject({ open: true, id: leave.id })}>Reject</button>
                        </>
                      )}
                      <button onClick={() => setConfirmDelete({ open: true, id: leave.id })}>Delete</button>
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
        totalItems={filteredLeaves.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
      </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">New Leave Request</h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {startDate && endDate && endDate >= startDate && (
                <p className="text-xs text-blue-600 font-medium">
                  Duration: {getDayCount(startDate, endDate)} day(s)
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Medical appointment"
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
                onClick={saveLeave}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
          isOpen={confirmApprove.open}
          title="Approve Leave"
          message="Are you sure you want to approve this leave request?"
          confirmLabel="Approve"
          confirmColor="green"
          onConfirm={() => { confirmApprove.id && handleApprove(confirmApprove.id); setConfirmApprove({ open: false, id: null }); }}
          onCancel={() => setConfirmApprove({ open: false, id: null })}
        />
        <ConfirmModal
          isOpen={confirmReject.open}
          title="Reject Leave"
          message="Are you sure you want to reject this leave request?"
          confirmLabel="Reject"
          confirmColor="red"
          onConfirm={() => { confirmReject.id && handleReject(confirmReject.id); setConfirmReject({ open: false, id: null }); }}
          onCancel={() => setConfirmReject({ open: false, id: null })}
        />
        <ConfirmModal
          isOpen={confirmDelete.open}
          title="Delete Leave Request"
          message="Are you sure you want to delete this leave request?"
          confirmLabel="Delete"
          confirmColor="red"
          onConfirm={() => { confirmDelete.id && handleDelete(confirmDelete.id); setConfirmDelete({ open: false, id: null }); }}
          onCancel={() => setConfirmDelete({ open: false, id: null })}
        />
    </div>
  );
}