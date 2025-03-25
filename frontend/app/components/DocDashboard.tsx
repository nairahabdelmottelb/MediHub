import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "./DocSidebar";
import Navbar from "./DocNavbar";
import DoctorDashboardHero from "./DoctorDashboardHero";
import "./dashboard.css";

// Define types for each page
interface DashboardPageInfo {
  bg: string;
  path?: string;
}

// Pages mapping for the Doctor's Portal
const doctorPages: Record<string, DashboardPageInfo> = {
  dashboard: { bg: "/images/dr.jpg" },
  appointments: { bg: "/images/calendar.jpg" },
  patients: { bg: "/images/patients.jpg" },
  records: { bg: "/images/records.jpg" },
  chat: { bg: "/images/support.jpg" },
};

type PageTitle = keyof typeof doctorPages;

export default function DoctorDashboard() {
  const [activeSection, setActiveSection] = useState<PageTitle>("dashboard");
  const location = useLocation();
  const page = location.pathname.split("/").pop() as PageTitle;
  const bg = doctorPages[page]?.bg;

  const handleNavClick = (section: PageTitle) => {
    setActiveSection(section);
  };

  return (
    <div className="container-fluid home-page">
      <div className="row">
        {/* Sidebar Navigation */}
        <Sidebar
          activeSection={activeSection}
          handleNavClick={handleNavClick}
        />

        {/* Main Content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <DoctorDashboardHero
            doctorName={
              activeSection === "dashboard"
                ? "Welcome, Doctor!"
                : `Manage ${
                    activeSection.charAt(0).toUpperCase() +
                    activeSection.slice(1)
                  }`
            }
            totalAppointments={5}
          />

          <div className="content-area py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
