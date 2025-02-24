import { useState } from "react";
import Sidebar from "./Sidebar";
import "./dashboard.css";
import DashboardHero from "./DashboardHero";
import Containers from "../Containers";
import { Outlet } from "react-router";

interface DashboardPageInfo {
  bg: string;
  path?: string;
}

export const dashboardPages: Record<string, DashboardPageInfo> = {
  dashboard: { bg: "/images/banner.png" },
  calendar: { bg: "/images/drpatient.jpg" },
  alerts: { bg: "/images/emergency.jpg" },
  tests: { bg: "/images/lab.jpg" },
  history: { bg: "/images/medical-bg.jpg" },
  medications: { bg: "/images/madications.jpg" },
  doctors: { bg: "/images/teamofdrs.jpg" },
  settings: { bg: "/images/settings.jpg" },
};

export type PageTitle = keyof typeof dashboardPages;

export default function DashboardLayout() {
  const [activeSection, setActiveSection] = useState<PageTitle>("dashboard");

  const handleNavClick = (section: PageTitle) => {
    setActiveSection(section);
  };

  return (
    <>
    <div className="container-fluid home-page">
      <div className="row">
        {/* Sidebar Navigation */}
        <Sidebar
          activeSection={activeSection}
          handleNavClick={handleNavClick}
        />

        {/* Main Content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          {/* Dynamic Background Hero Section */}
          <DashboardHero
            title={
              activeSection === "dashboard"
                ? "Quality Healthcare Made Accessible"
                : `Welcome to ${
                    activeSection.charAt(0).toUpperCase() +
                    activeSection.slice(1)
                  }`
            }
            bgSrc={dashboardPages[activeSection].bg}
          >
            {activeSection === "dashboard" && (
              <button className="btn btn-light btn-lg px-5 py-3">
                <i className="fas fa-calendar-plus me-2" />
                Book New Appointment
              </button>
            )}
          </DashboardHero>

          <div className="content-area py-4" id="contentArea">
            <p className="containers">
              {/* <Containers /> */}
              <Outlet />
            </p>
          </div>
        </main>
      </div>
    </div>

    <div className="modal fade" id="chatModal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                        <i className="fas fa-robot me-2"></i>MediBot
                    </h5>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body bg-light" style={{ height: "400px", overflowY: "auto" }}>
                  <div className="bot-message alert alert-secondary">
                    Hello! I'm MediBot. How can I assist you today?
                  </div>
                </div>
                <div className="modal-footer">
                    <div className="input-group">
                        <input type="text" className="form-control" placeholder="Type your message..." id="chatInput" />
                        <button className="btn btn-success" type="button" id="btnSend">
                            <i className="fas fa-paper-plane" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <button
      className="btn btn-primary rounded-circle position-fixed"
      style={{ bottom: "2rem", right: "2rem", width: "56px", height: "56px" }}
      data-bs-toggle="modal"
      data-bs-target="#chatModal"
    >
      <i className="fas fa-comment-medical" />
    </button>
    </>
  );
}
