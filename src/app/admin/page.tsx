import { AdminShell } from "@/components/admin/AdminShell";
import { platformSnapshot } from "@/lib/platform-data";

export default function AdminPage() {
  return <AdminShell snapshot={{ ...platformSnapshot, orders: [], customers: [], metrics: [] }} />;
}
