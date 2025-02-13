import type { Route } from "../../+types/root";
import "./dashboard.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="container-fluid home-page">
      <div className="row">
        {/* Full-height Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-primary sidebar min-vh-100">
          <div className="position-sticky">
            <div className="sidebar-header p-4">
              <h3 className="text-white">
                <i className="fas fa-hospital me-2" />
                MediHub
              </h3>
              <p className="text-white-50 mb-0">Patient Portal</p>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item">
                <a
                  className="nav-link text-white active"
                  data-section="dashboard"
                >
                  <i className="fas fa-home me-2" />
                  Dashboard
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" data-section="calendar">
                  <i className="fas fa-calendar-alt me-2" />
                  My Calendar
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" data-section="alerts">
                  <i className="fas fa-bell me-2" />
                  Alerts
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" data-section="tests">
                  <i className="fas fa-flask me-2" />
                  My Tests
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" data-section="history">
                  <i className="fas fa-history me-2" />
                  Medical History
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" data-section="medications">
                  <i className="fas fa-prescription-bottle me-2" />
                  Medications
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" data-section="doctors">
                  <i className="fas fa-user-md me-2" />
                  My Doctors
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" data-section="settings">
                  <i className="fas fa-cog me-2" />
                  Settings
                </a>
              </li>
              <li className="nav-item mt-4">
                <a className="nav-link text-white" id="logout">
                  <i className="fas fa-sign-out-alt me-2" />
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          {/* Hero Section with Background Image */}
          <section className="dashboard-hero">
            <div className="dashboard-overlay">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-md-8 text-center">
                    <div className="booking-card p-5 rounded">
                      <h2 className="text-white mb-4">
                        Quality Healthcare Made Accessible
                      </h2>
                      <button
                        className="btn btn-light btn-lg px-5 py-3"
                        id="bookAppointmentBtn"
                      >
                        <i className="fas fa-calendar-plus me-2" />
                        Book New Appointment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic Content */}
          <div className="content-area py-4" id="contentArea">
            {/* Dashboard content loaded here */}
          </div>
        </main>
      </div>
    </div>
  );
}
