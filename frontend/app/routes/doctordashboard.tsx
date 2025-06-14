import { Outlet } from "react-router";
import DocDashboardLayout from "../components/doctorDashboard/DocDashboardLayout";

export default function DoctorDashboardRoute() {
  return (
    <DocDashboardLayout>
      <Outlet />
    </DocDashboardLayout>
  );
}
