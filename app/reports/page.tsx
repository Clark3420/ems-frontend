"use client";

import { useEffect, useState } from "react";
import {
  getEmployees,
  getAttendance,
  getPayrolls,
  getLeaves,
} from "@/lib/api";
import { exportToExcel } from "@/lib/export";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

    const [attendanceSummary, setAttendanceSummary] = useState<
    { name: string; present: number; absent: number; late: number; halfDay: number }[]
    >([]);

    const [payrollSummary, setPayrollSummary] = useState<
    { name: string; position: string; netPay: number; status: string }[]
    >([]);

    const [leaveSummary, setLeaveSummary] = useState<
    { name: string; sick: number; vacation: number; personal: number; total: number }[]
    >([]);

  const [overallStats, setOverallStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalPayroll: 0,
    totalLeaves: 0,
  });

  useEffect(() => {
    loadReports();
  }, [selectedMonth]);

  async function loadReports() {
    setLoading(true);
    try {
      const [employees, allAttendance, allPayroll, allLeaves] =
        await Promise.all([
            getEmployees(),
            getAttendance(),
            getPayrolls(),
            getLeaves(),
        ]);

      // Filter by selected month
      const [year, month] = selectedMonth.split("-").map(Number);

      const monthAttendance = allAttendance.filter((a) => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      const monthPayroll = allPayroll.filter((p) => {
        const d = new Date(p.period_start);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      const monthLeaves = allLeaves.filter((l) => {
        const d = new Date(l.start_date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      // Attendance summary per employee
      const attSummary = employees.map((emp: any) => {
        const empAtt = monthAttendance.filter((a) => a.employee_id === emp.id);
        return {
          name: emp.name,
          present: empAtt.filter((a) => a.status === "present").length,
          absent: empAtt.filter((a) => a.status === "absent").length,
          late: empAtt.filter((a) => a.status === "late").length,
          halfDay: empAtt.filter((a) => a.status === "half-day").length,
        };
      });

      // Payroll summary per employee
      const paySummary = monthPayroll.map((p) => ({
        name: p.employee.name,
        position: p.employee.position,
        netPay: Number(p.net_pay),
        status: p.status,
      }));

      // Leave summary per employee
      const lvSummary = employees.map((emp: any) => {
        const empLeaves = monthLeaves.filter(
          (l) => l.employee_id === emp.id && l.status === "approved"
        );
        return {
          name: emp.name,
          sick: empLeaves.filter((l) => l.leave_type === "sick").length,
          vacation: empLeaves.filter((l) => l.leave_type === "vacation").length,
          personal: empLeaves.filter((l) => l.leave_type === "personal").length,
          total: empLeaves.length,
        };
      }).filter((e) => e.total > 0);

      // Overall stats
      setOverallStats({
        totalPresent: monthAttendance.filter((a) => a.status === "present").length,
        totalAbsent: monthAttendance.filter((a) => a.status === "absent").length,
        totalPayroll: monthPayroll.reduce((sum, p) => sum + Number(p.net_pay), 0),
        totalLeaves: monthLeaves.filter((l) => l.status === "approved").length,
      });

      setAttendanceSummary(attSummary);
      setPayrollSummary(paySummary);
      setLeaveSummary(lvSummary);
    } catch (err) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  function exportAttendanceReport() {
    const data = attendanceSummary.map((e) => ({
      Employee: e.name,
      Present: e.present,
      Absent: e.absent,
      Late: e.late,
      "Half-day": e.halfDay,
      Total: e.present + e.absent + e.late + e.halfDay,
    }));
    exportToExcel(data, `Attendance_Report_${selectedMonth}`, "Attendance");
    toast.success("Attendance report exported");
  }

  function exportPayrollReport() {
    const data = payrollSummary.map((e) => ({
      Employee: e.name,
      Position: e.position,
      "Net Pay": e.netPay,
      Status: e.status,
    }));
    exportToExcel(data, `Payroll_Report_${selectedMonth}`, "Payroll");
    toast.success("Payroll report exported");
  }

  function exportLeaveReport() {
    const data = leaveSummary.map((e) => ({
      Employee: e.name,
      Sick: e.sick,
      Vacation: e.vacation,
      Personal: e.personal,
      Total: e.total,
    }));
    exportToExcel(data, `Leave_Report_${selectedMonth}`, "Leave");
    toast.success("Leave report exported");
  }

  const monthName = new Date(`${selectedMonth}-01`).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monthly summary for {monthName}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Select Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Loading reports...
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Present</p>
              <p className="text-3xl font-bold text-green-600">{overallStats.totalPresent}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Absent</p>
              <p className="text-3xl font-bold text-red-600">{overallStats.totalAbsent}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Payroll</p>
              <p className="text-xl font-bold text-purple-600">
                ₱{overallStats.totalPayroll.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Approved Leaves</p>
              <p className="text-3xl font-bold text-blue-600">{overallStats.totalLeaves}</p>
            </div>
          </div>

          {/* Attendance Report */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Attendance Report
              </h2>
              <button
                onClick={exportAttendanceReport}
                disabled={attendanceSummary.length === 0}
                className="text-xs font-medium px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
              >
                📥 Export
              </button>
            </div>
            {attendanceSummary.every((e) => e.present + e.absent + e.late + e.halfDay === 0) ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No attendance records for {monthName}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Present</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Absent</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Late</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Half-day</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendanceSummary
                      .filter((e) => e.present + e.absent + e.late + e.halfDay > 0)
                      .map((emp) => (
                        <tr key={emp.name} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-medium text-gray-800">{emp.name}</td>
                          <td className="px-6 py-4 text-green-600 font-medium">{emp.present}</td>
                          <td className="px-6 py-4 text-red-600 font-medium">{emp.absent}</td>
                          <td className="px-6 py-4 text-yellow-600 font-medium">{emp.late}</td>
                          <td className="px-6 py-4 text-blue-600 font-medium">{emp.halfDay}</td>
                          <td className="px-6 py-4 text-gray-800 font-semibold">
                            {emp.present + emp.absent + emp.late + emp.halfDay}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payroll Report */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Payroll Report
              </h2>
              <button
                onClick={exportPayrollReport}
                disabled={payrollSummary.length === 0}
                className="text-xs font-medium px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
              >
                📥 Export
              </button>
            </div>
            {payrollSummary.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No payroll records for {monthName}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Position</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Net Pay</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payrollSummary.map((pay, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-800">{pay.name}</td>
                        <td className="px-6 py-4 text-gray-500">{pay.position}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          ₱{pay.netPay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                              pay.status === "paid"
                                ? "bg-green-50 text-green-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Total Row */}
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-700">
                        Total
                      </td>
                      <td className="px-6 py-3 font-bold text-gray-800">
                        ₱{payrollSummary
                          .reduce((sum, p) => sum + p.netPay, 0)
                          .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Leave Report */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Leave Report
              </h2>
              <button
                onClick={exportLeaveReport}
                disabled={leaveSummary.length === 0}
                className="text-xs font-medium px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
              >
                📥 Export
              </button>
            </div>
            {leaveSummary.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No approved leaves for {monthName}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sick</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vacation</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Personal</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaveSummary.map((emp) => (
                      <tr key={emp.name} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-800">{emp.name}</td>
                        <td className="px-6 py-4 text-red-600 font-medium">{emp.sick}</td>
                        <td className="px-6 py-4 text-blue-600 font-medium">{emp.vacation}</td>
                        <td className="px-6 py-4 text-purple-600 font-medium">{emp.personal}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{emp.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}