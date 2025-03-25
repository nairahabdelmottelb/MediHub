import { useMemo, useState } from "react";
import Sidebar from "../Sidebar";
import "../dashboard.css";
import DashboardHero from "./DashboardHero";
import Containers from "../doctorDashboard/Containers";
import { Outlet, Routes, useLocation } from "react-router";
import ChatWindow from "./ChatWindow/ChatWindow";
import type DashboardPageInfo from "~/types/DashboardPageInfo";

export const patientDashboardPages: Record<string, DashboardPageInfo> = {
  dashboard: {
    bg: "/images/banner.png",
    heroChildren: (
      <button className="btn btn-light btn-lg px-5 py-3">
        <i className="fas fa-calendar-plus me-2" />
        Book New Appointment
      </button>
    ),
  },
  calendar: { bg: "/images/drpatient.jpg" },
  alerts: { bg: "/images/emergency.jpg" },
  tests: { bg: "/images/lab.jpg" },
  history: { bg: "/images/medical-bg.jpg" },
  medications: { bg: "/images/madications.jpg" },
  doctors: { bg: "/images/teamofdrs.jpg" },
};

export type PageTitle = keyof typeof patientDashboardPages;

export default function DashboardLayout() {
  const [showChatModal, setShowChatModal] = useState(false);

  const location = useLocation();
  const page = useMemo(
    () => location.pathname.split("/").pop() as PageTitle,
    [location]
  );
  const bg = patientDashboardPages[page]?.bg;

  return (
    <>
      <div className="container-fluid home-page">
        <div className="row">
          {/* Sidebar Navigation */}
          <Sidebar pages={patientDashboardPages} prefix="/patient" />

          {/* Main Content */}
          <main className="offset-md-3 offset-lg-2 col-md-9 ms-sm-auto col-lg-10 px-md-4">
            {/* Dynamic Background Hero Section */}
            <DashboardHero
              title={
                page === "dashboard"
                  ? "Quality Healthcare Made Accessible"
                  : `Welcome to ${page.charAt(0).toUpperCase() + page.slice(1)}`
              }
              bgSrc={bg}
            >
              {patientDashboardPages[page]?.heroChildren}
            </DashboardHero>

            <div className="content-area py-4" id="contentArea">
              {/* <Containers /> */}
              <Outlet />
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
