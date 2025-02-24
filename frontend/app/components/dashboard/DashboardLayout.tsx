import { useState } from "react";
import Sidebar from "./Sidebar";
import "./dashboard.css";
import DashboardHero from "./DashboardHero";
import Containers from "../Containers";
import { Outlet } from "react-router";
import ChatWindow from "./ChatWindow/ChatWindow";

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
  const [showChatModal, setShowChatModal] = useState(false);

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

      <ChatWindow
        show={showChatModal}
        handleClose={() => setShowChatModal(false)}
      />

      <button
        className="btn btn-primary rounded-circle position-fixed"
        style={{
          transition: "opacity 0.2s",
          opacity: showChatModal ? 0 : 1,
          pointerEvents: showChatModal ? "none" : "auto",
          bottom: "2rem",
          right: "2rem",
          width: "56px",
          height: "56px",
        }}
        onClick={() => setShowChatModal((prev) => !prev)}
      >
        <i className="fas fa-comment-medical" />
      </button>
    </>
  );
}
