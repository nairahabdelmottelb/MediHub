import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import "../../components/dashboard.css";
import Sidebar from "../Sidebar";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

// Pages mapping for the Admin Portal
const adminPages = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: "home",
    bg: "/images/admin-dashboard.jpg",
    description: "Administration overview and quick actions",
  },
  {
    name: "Manage Doctors",
    path: "/admin/managedoc",
    icon: "user-md",
    bg: "/images/doctors.jpg",
    description: "Manage doctor profiles and permissions",
  },
  {
    name: "Manage Patients",
    path: "/admin/managepatient",
    icon: "users",
    bg: "/images/patients.jpg",
    description: "Manage patient records and access",
  },
  {
    name: "Business Analytics",
    path: "/admin/businessanalytics",
    icon: "chart-line",
    bg: "/images/business.jpg",
    description: "Financial and operational analytics",
  },
  {
    name: "Medical Analytics",
    path: "/admin/medicalanalytics",
    icon: "chart-bar",
    bg: "/images/medical.jpg",
    description: "Healthcare metrics and insights",
  },
];

type PageTitle = (typeof adminPages)[number]["name"];

export default function AdminDashboard({
  children,
}: AdminDashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState<PageTitle>("Dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const page = location.pathname.split("/").pop() as string;
  const currentPage = adminPages.find((p) => p.path.includes(page));
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
        <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-header">
            {!isSidebarCollapsed && (
              <h5 className="mb-0 text-white">Admin Portal</h5>
            )}
            <button
              className="sidebar-collapse-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <i
                className={`fas fa-${
                  isSidebarCollapsed ? "chevron-right" : "chevron-left"
                }`}
              />
            </button>
          </div>
          <Sidebar pages={adminPages} collapsed={isSidebarCollapsed} />
        </aside>

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
                    className="btn btn-light d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                  >
                    <div
                      className="rounded-circle bg-primary text-white p-2"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="fas fa-user-shield" />
                    </div>
                    <span>Admin</span>
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
