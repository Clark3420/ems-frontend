"use client";

import { useEffect, useState } from "react";
import {
  getSettings,
  SettingsData,
  getEmployees,
  getAttendance,
  getPayrolls,
  getLeaves,
  getDepartments,
} from "@/lib/api";

export default function Home() {
  const [adminInfo, setAdminInfo] = useState<SettingsData | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    totalPayroll: 0,
    pendingPayroll: 0,
    pendingLeaves: 0,
    attendanceRate: 0,
  });
  const [departmentStats, setDepartmentStats] = useState<
    { name: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [adminData, employees, todayAttendance, payrolls, leaves, departments] =
        await Promise.all([
          getSettings(),
          getEmployees(),
          getAttendance(new Date().toISOString().split("T")[0]),
          getPayrolls(),
          getLeaves(),
          getDepartments(),
        ]);

      setAdminInfo(adminData);

      const presentCount = todayAttendance.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;

      const absentCount = todayAttendance.filter(
        (a) => a.status === "absent"
      ).length;

      const totalPayrollAmount = payrolls.reduce(
        (sum, p) => sum + Number(p.net_pay),
        0
      );

      const pendingPayrollCount = payrolls.filter(
        (p) => p.status === "pending"
      ).length;

      const pendingLeavesCount = leaves.filter(
        (l) => l.status === "pending"
      ).length;

      const attendanceRate =
        employees.length > 0
          ? Math.round((presentCount / employees.length) * 100)
          : 0;

      setStats({
        totalEmployees: employees.length,
        presentToday: presentCount,
        absentToday: absentCount,
        totalPayroll: totalPayrollAmount,
        pendingPayroll: pendingPayrollCount,
        pendingLeaves: pendingLeavesCount,
        attendanceRate,
      });

      // Department breakdown
      const deptStats = departments.map((dept) => ({
        name: dept.name,
        count: employees.filter((e: any) => e.department_id === dept.id).length,
      }));

      // Add unassigned employees
      const unassigned = employees.filter((e: any) => !e.department_id).length;
      if (unassigned > 0) {
        deptStats.push({ name: "Unassigned", count: unassigned });
      }

      setDepartmentStats(deptStats);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Welcome Section */}
      {adminInfo && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {adminInfo.admin_name || "Admin"}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {adminInfo.admin_email || "admin@ems.com"}
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Total Employees
              </p>
              <p className="text-3xl font-bold bg-blue-50 text-blue-600 w-fit px-2 py-0.5 rounded-lg">
                {stats.totalEmployees}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Present Today
              </p>
              <p className="text-3xl font-bold bg-green-50 text-green-600 w-fit px-2 py-0.5 rounded-lg">
                {stats.presentToday}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Absent Today
              </p>
              <p className="text-3xl font-bold bg-red-50 text-red-600 w-fit px-2 py-0.5 rounded-lg">
                {stats.absentToday}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Total Payroll
              </p>
              <p className="text-xl font-bold bg-purple-50 text-purple-600 w-fit px-2 py-0.5 rounded-lg">
                ₱{stats.totalPayroll.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Attendance Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.attendanceRate}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
                  📊
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Pending Payroll
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.pendingPayroll}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-2xl">
                  ⏳
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Pending Leaves
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.pendingLeaves}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl">
                  🏖️
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          {departmentStats.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Employees by Department
              </h2>
              <div className="space-y-3">
                {departmentStats.map((dept) => (
                  <div key={dept.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{dept.name}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {dept.count} {dept.count === 1 ? "employee" : "employees"}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width:
                            stats.totalEmployees > 0
                              ? `${Math.round((dept.count / stats.totalEmployees) * 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-400 text-center py-4">
              Select a module from the sidebar to manage your workforce.
            </p>
          </div>
        </>
      )}
    </div>
  );
}