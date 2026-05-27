"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getEmployees,
  getAttendance,
  getPayrolls,
  getLeaves,
  AttendanceRecord,
  PayrollRecord,
  LeaveRecord,
} from "@/lib/api";
import toast from "react-hot-toast";

type Employee = {
  id: number;
  name: string;
  position: string;
  department?: { id: number; name: string } | null;
};

type Tab = "attendance" | "payroll" | "leave";

const STATUS_STYLES: Record<string, string> = {
  present: "bg-green-50 text-green-700",
  absent: "bg-red-50 text-red-600",
  late: "bg-yellow-50 text-yellow-700",
  "half-day": "bg-blue-50 text-blue-600",
  paid: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

const LEAVE_TYPE_STYLES: Record<string, string> = {
  sick: "bg-red-50 text-red-600",
  vacation: "bg-blue-50 text-blue-600",
  personal: "bg-purple-50 text-purple-600",
};

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = Number(params.id);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("attendance");

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  async function loadEmployeeData() {
    setLoading(true);
    try {
      const [employees, allAttendance, allPayroll, allLeaves] = await Promise.all([
        getEmployees(),
        getAttendance(),
        getPayrolls(),
        getLeaves(),
      ]);

      const emp = employees.find((e) => e.id === employeeId);
      if (!emp) {
        toast.error("Employee not found");
        router.push("/employees");
        return;
      }

      setEmployee(emp);
      setAttendanceHistory(allAttendance.filter((a) => a.employee_id === employeeId));
      setPayrollHistory(allPayroll.filter((p) => p.employee_id === employeeId));
      setLeaveHistory(allLeaves.filter((l) => l.employee_id === employeeId));
    } catch (err) {
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400 text-sm">
        Loading employee profile...
      </div>
    );
  }

  if (!employee) return null;

  const totalPayroll = payrollHistory.reduce((sum, p) => sum + Number(p.net_pay), 0);
  const presentCount = attendanceHistory.filter((a) => a.status === "present").length;
  const absentCount = attendanceHistory.filter((a) => a.status === "absent").length;
  const approvedLeaves = leaveHistory.filter((l) => l.status === "approved").length;
  const pendingLeaves = leaveHistory.filter((l) => l.status === "pending").length;

  function getDayCount(start: string, end: string) {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div>
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/employees")}
          className="text-gray-600 hover:text-gray-800 transition text-sm font-medium"
        >
          ← Back to Employees
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
            <p className="text-gray-500 mt-0.5">{employee.position}</p>
            {employee.department && (
              <span className="mt-2 inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {employee.department.name}
              </span>
            )}
            <div className="mt-3 text-xs text-gray-400">Employee ID: #{employee.id}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Present</p>
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Absent</p>
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Leaves Taken</p>
          <p className="text-2xl font-bold text-blue-600">{approvedLeaves}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pending Leaves</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingLeaves}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Payroll</p>
          <p className="text-lg font-bold text-purple-600">
            ₱{totalPayroll.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(["attendance", "payroll", "leave"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab === "attendance"
                ? `Attendance (${attendanceHistory.length})`
                : tab === "payroll"
                ? `Payroll (${payrollHistory.length})`
                : `Leave (${leaveHistory.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <>
              {attendanceHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">
                  No attendance records yet
                </p>
              ) : (
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Clock In</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Clock Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendanceHistory.map((att) => (
                      <tr key={att.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 text-gray-800">{att.date}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[att.status]}`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{att.clock_in ?? "—"}</td>
                        <td className="px-6 py-3 text-gray-500">{att.clock_out ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Payroll Tab */}
          {activeTab === "payroll" && (
            <>
              {payrollHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">
                  No payroll records yet
                </p>
              ) : (
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Basic</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Net Pay</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payrollHistory.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 text-gray-800 text-xs">
                          {pay.period_start} → {pay.period_end}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          ₱{Number(pay.basic_salary).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-semibold text-gray-800">
                          ₱{Number(pay.net_pay).toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[pay.status]}`}>
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Leave Tab */}
          {activeTab === "leave" && (
            <>
              {leaveHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">
                  No leave records yet
                </p>
              ) : (
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Days</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaveHistory.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${LEAVE_TYPE_STYLES[leave.leave_type]}`}>
                            {leave.leave_type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-800 text-xs">
                          {leave.start_date} → {leave.end_date}
                        </td>
                        <td className="px-6 py-3 text-gray-600 font-medium">
                          {getDayCount(leave.start_date, leave.end_date)}d
                        </td>
                        <td className="px-6 py-3 text-gray-500 max-w-xs truncate">
                          {leave.reason || "—"}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[leave.status]}`}>
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}