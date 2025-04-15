import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Navbar from "./DocNavbar";
import DoctorDashboardHero from "./DoctorDashboardHero";
import "../../components/dashboard.css";
import Sidebar from "../Sidebar";
import type { DashboardPageInfo } from "~/types/DashboardPageInfo";

// Pages mapping for the Doctor's Portal with enhanced metadata
const doctorPages = [
  {
    name: "Dashboard",
    path: "/doctor/dashboard",
    icon: "home",
    bg: "/images/dr.jpg",
    description: "Overview of your daily activities",
  },
  {
    name: "Calendar",
    path: "/doctor/calendar",
    icon: "calendar-alt",
    bg: "/images/calendar.jpg",
    description: "Manage your appointments",
  },
  {
    name: "Patients",
    path: "/doctor/patients",
    icon: "users",
    bg: "/images/patients.jpg",
    description: "Patient management",
    children: [
      {
        name: "Medical Records",
        path: "/doctor/records",
        icon: "file-medical",
        bg: "/images/records.jpg",
        description: "View and manage patient records",
      },
      {
        name: "Lab Tests",
        path: "/doctor/tests",
        icon: "vial",
        bg: "/images/tests.jpg",
        description: "View and order lab tests",
      },
      {
        name: "Medications",
        path: "/doctor/medications",
        icon: "pills",
        bg: "/images/medications.jpg",
        description: "Prescribe and track medications",
      },
    ],
  },
  {
    name: "AI Assistant",
    path: "/doctor/chat",
    icon: "comment-medical",
    bg: "/images/support.jpg",
    description: "Get AI-powered insights",
  },
];

type PageTitle = (typeof doctorPages)[number]["name"];

export default function DoctorDashboard() {
  const [activeSection, setActiveSection] = useState<PageTitle>("Dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const page = location.pathname.split("/").pop() as string;
  const currentPage = doctorPages.find((p) => p.path.includes(page));
  const bg = currentPage?.bg;

  // Update active section when route changes
  useEffect(() => {
    if (currentPage) {
      setActiveSection(currentPage.name);
    }
  }, [currentPage]);

  return (
    <div
      className={`container-fluid home-page ${
        isSidebarCollapsed ? "collapsed" : ""
      }`}
    >
      <div className="row">
        {/* Sidebar Navigation */}
        <div
          className={`sidebar-wrapper bg-primary ${
            isSidebarCollapsed ? "collapsed" : ""
          }`}
        >
          <div className="sidebar-header p-3 mb-3 d-flex align-items-center justify-content-between">
            {!isSidebarCollapsed && (
              <h5 className="mb-0 text-white">Doctor's Portal</h5>
            )}
            <button
              className="sidebar-collapse-btn btn btn-primary"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <i
                className={`fas fa-${
                  isSidebarCollapsed ? "chevron-right" : "chevron-left"
                }`}
              />
            </button>
          </div>
          <Sidebar pages={doctorPages} collapsed={isSidebarCollapsed} />
        </div>

        {/* Main Content */}
        <main className="main-content">
          <div className="main-header">
            <div className="d-flex justify-content-between align-items-center p-3">
              <div>
                <h4 className="mb-0">{currentPage?.name || activeSection}</h4>
                <p className="text-muted mb-0 small">
                  {currentPage?.description}
                </p>
              </div>
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-light position-relative">
                  <i className="fas fa-bell" />
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    3
                  </span>
                </button>
                <div className="dropdown">
                  <button
                    className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                  >
                    <div
                      className="rounded-circle bg-primary text-white p-2"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="fas fa-user-md" />
                    </div>
                    <span>Dr. Smith</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fas fa-user me-2" />
                        Profile
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fas fa-cog me-2" />
                        Settings
                      </a>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <a className="dropdown-item text-danger" href="#">
                        <i className="fas fa-sign-out-alt me-2" />
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="content-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
