"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  Wallet,
  Settings,
  Menu,
  X,
  Building2,
  CalendarOff,
  BarChart2
} from "lucide-react";
import NavItem from "@/components/NavItem";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "md:w-20" : "md:w-60"}
          w-64 h-full
          bg-gray-900 text-white flex flex-col
          transition-all duration-300 shrink-0
        `}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
          {(!collapsed || mobileOpen) && (
            <span className="text-white font-bold text-lg tracking-tight">EMS</span>
          )}
          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-700 ml-auto"
          >
            <Menu size={20} />
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-700 ml-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" collapsed={collapsed && !mobileOpen} />
          <NavItem href="/employees" icon={<Users size={18} />} label="Employees" collapsed={collapsed && !mobileOpen} />
          <NavItem href="/departments" icon={<Building2 size={18} />} label="Departments" collapsed={collapsed && !mobileOpen} />
          <NavItem href="/attendance" icon={<Clock size={18} />} label="Attendance" collapsed={collapsed && !mobileOpen} />
          <NavItem href="/leave" icon={<CalendarOff size={18} />} label="Leave" collapsed={collapsed && !mobileOpen} />
          <NavItem href="/reports" icon={<BarChart2 size={18} />} label="Reports" collapsed={collapsed && !mobileOpen} />
          <NavItem href="/payroll" icon={<Wallet size={18} />} label="Payroll" collapsed={collapsed && !mobileOpen} />
          <NavItem href="/settings" icon={<Settings size={18} />} label="Settings" collapsed={collapsed && !mobileOpen} />
        </nav>

        {/* Bottom */}
        {(!collapsed || mobileOpen) && (
          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">v1.0.0</p>
          </div>
        )}
      </aside>
    </>
  );
} 