"use client";

import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSettings, SettingsData } from "@/lib/api";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminInfo, setAdminInfo] = useState<SettingsData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && pathname !== "/login") {
      router.push("/login");
    } else if (token) {
      checkSetup();
    }
  }, [pathname, router]);

  async function checkSetup() {
    try {
      const data = await getSettings();
      setAdminInfo(data);

      // If admin credentials are not set up, redirect to settings
      const isFirstTime = !data.admin_email || !data.admin_password;
      if (isFirstTime && pathname !== "/settings") {
        router.push("/settings");
      }
    } catch (err) {
      console.error("Failed to load settings");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (pathname === "/login") {
    return (
      <html lang="en">
        <body className="m-0 font-sans bg-gray-50 text-gray-900">
          {children}
          <Toaster position="top-right" />
        </body>
      </html>
    );
  }

  const adminName = adminInfo?.admin_name || "Admin";
  const adminEmail = adminInfo?.admin_email || "admin@ems.com";
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <html lang="en">
          <head>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#2563eb" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="EMS" />
            <link rel="apple-touch-icon" href="/icon.svg" />
          </head>
      <body className="m-0 font-sans bg-gray-50 text-gray-900">
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between pl-16 md:pl-6 pr-4 md:pr-6 shrink-0">
              <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-widest hidden sm:block">
                Employee Management System
              </h3>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest sm:hidden">
                EMS
              </h3>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {adminInitial}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{adminName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{adminEmail}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2 md:px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* First-time setup banner */}
            {adminInfo && (!adminInfo.admin_email || !adminInfo.admin_password) && (
              <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please set up your admin credentials in Settings to get started.
                </p>
                <button
                  onClick={() => router.push("/settings")}
                  className="text-xs font-medium text-yellow-800 underline hover:text-yellow-900"
                >
                  Go to Settings →
                </button>
              </div>
            )}

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}