import { useState } from "react";
import "./dashboard.css";
import "bootstrap/dist/css/bootstrap.css";
import "./containers.tsx";
import { Link } from "react-router";

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sectionBackgrounds: { [key: string]: string } = {
    dashboard: "/images/banner.png",
    calendar: "/images/drpatient.jpg",
    alerts: "/images/emergency.jpg",
    tests: "/images/lab.jpg",
    history: "/images/medical-bg.jpg",
    medications: "/images/madications.jpg",
    doctors: "/images/teamofdrs.jpg",
    settings: "/images/settings.jpg",
  };

  const handleNavClick = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="container-fluid home-page">
      <div className="row">
        {/* Sidebar Navigation */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-primary sidebar min-vh-100">
          <div className="position-sticky">
            <div className="sidebar-header p-4">
              <h3 className="text-white">MediHub</h3>
              <p className="text-white-50 mb-0">Patient Portal</p>
            </div>
            <ul className="nav flex-column">
              {Object.keys(sectionBackgrounds).map((section) => (
                <li className="nav-item" key={section}>
                  <a
                    className={`nav-link text-white ${
                      activeSection === section ? "active" : ""
                    }`}
                    onClick={() => handleNavClick(section)}
                  >
                    <i
                      className={
                        section === "dashboard"
                          ? "home"
                          : section === "calendar"
                          ? "calendar-alt"
                          : section === "alerts"
                          ? "bell"
                          : section === "tests"
                          ? "flask"
                          : section === "history"
                          ? "history"
                          : section === "medications"
                          ? "prescription-bottle"
                          : section === "doctors"
                          ? "user-md"
                          : "cog"
                      }
                    />
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          {/* Dynamic Background Hero Section */}
          <section
            className="dashboard-hero"
            style={{
              backgroundImage: `url(${sectionBackgrounds[activeSection]})`,
            }}
          >
            <div className="dashboard-overlay">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-md-8 text-center">
                    <div className="booking-card p-5 rounded">
                      <h2 className="text-white mb-4">
                        {activeSection === "dashboard"
                          ? "Quality Healthcare Made Accessible"
                          : `Welcome to ${
                              activeSection.charAt(0).toUpperCase() +
                              activeSection.slice(1)
                            }`}
                      </h2>
                      {activeSection === "dashboard" && (
                        <button className="btn btn-light btn-lg px-5 py-3">
                          <i className="fas fa-calendar-plus me-2" /> Book New
                          Appointment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="content-area py-4" id="contentArea">
            <p className="containers">containers()</p>
          </div>
        </main>
      </div>
    </div>
  );
}
