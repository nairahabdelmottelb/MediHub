import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import "../dashboard.css";
import ChatModal from "./ChatWindow/ChatWindow";

// Pages mapping for the Patient's Portal with enhanced metadata
const patientPages = [
  {
    name: "Dashboard",
    path: "/patient/dashboard",
    icon: "home",
    bg: "/images/banner.png",
    description: "Overview of your health status",
  },
  {
    name: "Calendar",
    path: "/patient/calendar",
    icon: "calendar-alt",
    bg: "/images/drpatient.jpg",
    description: "Manage your appointments",
  },
  {
    name: "Alerts",
    path: "/patient/alerts",
    icon: "bell",
    bg: "/images/emergency.jpg",
    description: "View important notifications",
  },
  {
    name: "Tests",
    path: "/patient/tests",
    icon: "flask",
    bg: "/images/lab.jpg",
    description: "View lab test results",
  },
  {
    name: "History",
    path: "/patient/history",
    icon: "file-medical",
    bg: "/images/medical-bg.jpg",
    description: "View medical history",
  },
  {
    name: "Medications",
    path: "/patient/medications",
    icon: "pills",
    bg: "/images/madications.jpg",
    description: "Manage your medications",
  },
  {
    name: "Doctors",
    path: "/patient/doctors",
    icon: "user-md",
    bg: "/images/teamofdrs.jpg",
    description: "View your doctors",
  },
];

type PageTitle = (typeof patientPages)[number]["name"];

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const location = useLocation();
  const page = useMemo(
    () => location.pathname.split("/").pop() as PageTitle,
    [location]
  );
  const currentPage = patientPages.find(p => p.path.includes(page));
  const bg = currentPage?.bg;

  const handleLogout = () => {
    // Add logout logic here
    window.location.href = '/login';
  };

  return (
    <div className={`container-fluid patient-dashboard ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="row">
        {/* Sidebar Navigation */}
        <div className={`patient-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="patient-sidebar-header p-3 mb-3 d-flex align-items-center justify-content-between">
            {!isSidebarCollapsed && (
              <h5 className="mb-0 text-white">Patient's Portal</h5>
            )}
            <button
              className="patient-sidebar-collapse-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <i className={`fas fa-${isSidebarCollapsed ? 'chevron-right' : 'chevron-left'}`} />
            </button>
          </div>
          <nav className="patient-sidebar-nav">
            {patientPages.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className={`patient-nav-link ${location.pathname === page.path ? 'active' : ''}`}
              >
                <i className={`fas fa-${page.icon} me-2`} />
                {!isSidebarCollapsed && <span>{page.name}</span>}
              </Link>
            ))}
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="patient-nav-link text-danger"
                style={{ width: '100%', border: 'none', background: 'transparent' }}
              >
                <i className="fas fa-sign-out-alt me-2" />
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <main className="patient-main-content">
          {currentPage && (
            <div className="patient-dashboard-hero" style={{ backgroundImage: `url(${currentPage.bg})` }}>
              <div className="patient-dashboard-overlay">
                <div className="patient-booking-card">
                  <h2 className="text-white mb-4">{currentPage.name}</h2>
                  <p className="text-white mb-0">{currentPage.description}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="patient-main-header">
            <div className="d-flex justify-content-between align-items-center p-3">
              <div>
                <h4 className="mb-0">{currentPage?.name || 'Dashboard'}</h4>
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
                    <div className="rounded-circle bg-primary text-white p-2" style={{ width: '32px', height: '32px' }}>
                      <i className="fas fa-user" />
                    </div>
                    <span>John Doe</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><a className="dropdown-item" href="#"><i className="fas fa-user me-2" />Profile</a></li>
                    <li><a className="dropdown-item" href="#"><i className="fas fa-cog me-2" />Settings</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><a className="dropdown-item text-danger" href="#"><i className="fas fa-sign-out-alt me-2" />Logout</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="patient-content-area">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Chat Button */}
      <button
        className="chat-button btn btn-primary rounded-circle"
        onClick={() => setShowChat(true)}
      >
        <i className="fas fa-robot" />
      </button>

      {/* Chat Window */}
      <ChatModal show={showChat} handleClose={() => setShowChat(false)} />
    </div>
  );
}
