const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Helper: auto logout on 401
function handleUnauthorized() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (res.status === 401) { 
    handleUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }
  return res;
}

// --- Auth ---
export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

// --- Employees ---
export async function getEmployees() {
  const res = await apiFetch(`${BASE_URL}/employees`);
  return res.json();
}

export async function addEmployee(data: { name: string; position: string; email?: string | null; department_id?: number | null }) {
  const res = await apiFetch(`${BASE_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEmployee(id: number) {
  const res = await apiFetch(`${BASE_URL}/employees/${id}`, { method: "DELETE" });
  return res.json();
}

export async function updateEmployee(id: number, data: { name: string; position: string; email?: string | null; department_id?: number | null }) {
  const res = await apiFetch(`${BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// --- Attendance ---
export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  employee: { id: number; name: string; position: string };
}

export async function getAttendance(date?: string): Promise<AttendanceRecord[]> {
  const url = date ? `${BASE_URL}/attendance?date=${date}` : `${BASE_URL}/attendance`;
  const res = await apiFetch(url);
  return res.json();
}

export async function createAttendance(data: {
  employee_id: number;
  date: string;
  status: string;
  clock_in?: string | null;
  clock_out?: string | null;
}) {
  const res = await apiFetch(`${BASE_URL}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create attendance");
  }
  return res.json();
}

export async function updateAttendance(
  id: number,
  data: { status?: string; clock_in?: string | null; clock_out?: string | null }
) {
  const res = await apiFetch(`${BASE_URL}/attendance/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteAttendance(id: number) {
  const res = await apiFetch(`${BASE_URL}/attendance/${id}`, { method: "DELETE" });
  return res.json();
}

// --- Payroll ---
export interface PayrollRecord {
  id: number;
  employee_id: number;
  period_start: string;
  period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  tax: number;
  net_pay: number;
  status: string;
  employee: { id: number; name: string; position: string };
}

export async function getPayrolls(): Promise<PayrollRecord[]> {
  const res = await apiFetch(`${BASE_URL}/payroll`);
  return res.json();
}

export async function createPayroll(data: {
  employee_id: number;
  period_start: string;
  period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  tax: number;
}) {
  const res = await apiFetch(`${BASE_URL}/payroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create payroll");
  }
  return res.json();
}

export async function updatePayroll(
  id: number,
  data: {
    basic_salary?: number;
    allowances?: number;
    deductions?: number;
    tax?: number;
    status?: string;
  }
) {
  const res = await apiFetch(`${BASE_URL}/payroll/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePayroll(id: number) {
  const res = await apiFetch(`${BASE_URL}/payroll/${id}`, { method: "DELETE" });
  return res.json();
}

export async function markPayrollPaid(id: number) {
  const res = await apiFetch(`${BASE_URL}/payroll/${id}/mark-paid`, {
    method: "PATCH",
  });
  return res.json();
}

// --- Departments ---
export interface Department {
  id: number;
  name: string;
  description: string | null;
}

export async function getDepartments(): Promise<Department[]> {
  const res = await apiFetch(`${BASE_URL}/departments`);
  return res.json();
}

export async function createDepartment(data: { name: string; description?: string }) {
  const res = await apiFetch(`${BASE_URL}/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create department");
  }
  return res.json();
}

export async function updateDepartment(id: number, data: { name: string; description?: string }) {
  const res = await apiFetch(`${BASE_URL}/departments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteDepartment(id: number) {
  const res = await apiFetch(`${BASE_URL}/departments/${id}`, { method: "DELETE" });
  return res.json();
}

// --- Leaves ---
export interface LeaveRecord {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  employee: { id: number; name: string; position: string };
}

export async function getLeaves(): Promise<LeaveRecord[]> {
  const res = await apiFetch(`${BASE_URL}/leaves`);
  return res.json();
}

export async function createLeave(data: {
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
}) {
  const res = await apiFetch(`${BASE_URL}/leaves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create leave");
  }
  return res.json();
}

export async function updateLeave(id: number, data: { status?: string; reason?: string }) {
  const res = await apiFetch(`${BASE_URL}/leaves/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteLeave(id: number) {
  const res = await apiFetch(`${BASE_URL}/leaves/${id}`, { method: "DELETE" });
  return res.json();
}

export async function approveLeave(id: number) {
  const res = await apiFetch(`${BASE_URL}/leaves/${id}/approve`, { method: "PATCH" });
  return res.json();
}

export async function rejectLeave(id: number) {
  const res = await apiFetch(`${BASE_URL}/leaves/${id}/reject`, { method: "PATCH" });
  return res.json();
}

// --- Settings ---
export interface SettingsData {
  company_name: string;
  company_address: string;
  company_email: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
}

export async function getSettings(): Promise<SettingsData> {
  const res = await apiFetch(`${BASE_URL}/settings`);
  return res.json();
}

export async function updateSettings(data: SettingsData): Promise<SettingsData> {
  const res = await apiFetch(`${BASE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update settings");
  }
  return res.json();
}