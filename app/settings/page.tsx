"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings, SettingsData } from "@/lib/api";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update the form state
  const [form, setForm] = useState<SettingsData>({
    company_name: "",
    company_address: "",
    company_email: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getSettings();
        setForm(data);
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(field: keyof SettingsData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400 text-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your company and admin profile</p>
      </div>

      {/* Company Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Company Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Address</label>
            <textarea
              value={form.company_address}
              onChange={(e) => handleChange("company_address", e.target.value)}
              placeholder="e.g. 123 Main St, Quezon City"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Email</label>
            <input
              type="email"
              value={form.company_email}
              onChange={(e) => handleChange("company_email", e.target.value)}
              placeholder="e.g. info@company.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Admin Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Admin Name</label>
            <input
              type="text"
              value={form.admin_name}
              onChange={(e) => handleChange("admin_name", e.target.value)}
              placeholder="e.g. Clark"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Admin Email</label>
            <input
              type="email"
              value={form.admin_email}
              onChange={(e) => handleChange("admin_email", e.target.value)}
              placeholder="e.g. admin@ems.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.admin_password}
                onChange={(e) => handleChange("admin_password", e.target.value)}
                placeholder="Enter new password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SMTP Settings */}
<div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
    Email (SMTP) Settings
  </h2>
  <p className="text-xs text-gray-400 mb-4">
    Used to send email notifications for leave approvals. Works with Gmail, Outlook, etc.
  </p>
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
        <input
          type="text"
          value={form.smtp_host}
          onChange={(e) => handleChange("smtp_host", e.target.value)}
          placeholder="e.g. smtp.gmail.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Port</label>
        <input
          type="number"
          value={form.smtp_port}
          onChange={(e) => handleChange("smtp_port", e.target.value)}
          placeholder="587"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Email</label>
      <input
        type="email"
        value={form.smtp_user}
        onChange={(e) => handleChange("smtp_user", e.target.value)}
        placeholder="e.g. yourapp@gmail.com"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Password</label>
      <input
        type="password"
        value={form.smtp_password}
        onChange={(e) => handleChange("smtp_password", e.target.value)}
        placeholder="App password or SMTP password"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
      💡 For Gmail: use <strong>smtp.gmail.com</strong>, port <strong>587</strong>, and generate an <strong>App Password</strong> at myaccount.google.com/apppasswords
    </div>
  </div>
</div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}