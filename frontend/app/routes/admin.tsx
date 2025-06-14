import { Route, Routes } from "react-router";
import AdminDashboardRoute from "./admindashboard";
import AdminDashboard from "./admindashboard/adminDashboard";
import ManageDoctors from "./admindashboard/manageDoctors";
import ManagePatients from "./admindashboard/managePatients";
import BusinessAnalytics from "./admindashboard/businessAnalytics";
import MedicalAnalytics from "./admindashboard/medicalAnalytics";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboardRoute />}>
        <Route index element={<AdminDashboard />} />
        <Route path="doctors" element={<ManageDoctors />} />
        <Route path="patients" element={<ManagePatients />} />
        <Route path="business" element={<BusinessAnalytics />} />
        <Route path="medical" element={<MedicalAnalytics />} />
      </Route>
    </Routes>
  );
}
