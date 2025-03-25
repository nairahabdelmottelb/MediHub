import React from "react";

interface SidebarProps {
  activeSection: string;
  handleNavClick: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, handleNavClick }) => {
  return (
    <nav className="sidebar">
      <ul>
        <li
          className={activeSection === "Dashboard" ? "active" : ""}
          onClick={() => handleNavClick("DashBoard")}
        >
          Dashboard
        </li>
        <li
          className={activeSection === "Calendar" ? "active" : ""}
          onClick={() => handleNavClick("Calendar")}
        >
          calendar
        </li>
        <ul
          className={activeSection === "Patients" ? "active" : ""}
          onClick={() => handleNavClick("Patients")}
        >
          Patients
          <li
            className={activeSection === "Patient Records" ? "active" : ""}
            onClick={() => handleNavClick("Records")}
          >
            Records
          </li>
          <li
            className={activeSection === "Patient Tests" ? "active" : ""}
            onClick={() => handleNavClick("Tests")}
          >
            Tests
          </li>
          <li
            className={activeSection === "records" ? "active" : ""}
            onClick={() => handleNavClick("records")}
          >
            Medical Records
          </li>
        </ul>
        <li
          className={activeSection === "chat" ? "active" : ""}
          onClick={() => handleNavClick("chat")}
        >
          Chat & Support
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
