import { Outlet } from "react-router";
import AdminDashboardLayout from "../components/adminDashboard/AdminDashboardLayout";

export default function AdminDashboardRoute() {
  return (
    <AdminDashboardLayout>
      <Outlet />
    </AdminDashboardLayout>
  );
}
