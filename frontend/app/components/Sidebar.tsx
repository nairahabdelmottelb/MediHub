import { NavLink } from "react-router";
import {
  patientDashboardPages,
  type PageTitle,
} from "./patientDashboard/DashboardLayout";
import type DashboardPageInfo from "~/types/DashboardPageInfo";

export default function Sidebar(props: {
  pages: Record<string, DashboardPageInfo>;
  prefix?: string;
}) {
  return (
    <nav className="col-md-3 col-lg-2 d-md-flex bg-primary sidebar">
      <div className="position-sticky d-flex flex-column flex-grow-1">
        <div className="sidebar-header p-4">
          <NavLink to="/">
            <h3 className="text-white">MediHub</h3>
          </NavLink>
          <p className="text-white-50 mb-0">Patient Portal</p>
        </div>

        <ul className="nav flex-column flex-grow-1">
          {Object.entries(patientDashboardPages).map(([pageName, pageInfo]) => (
            <li className="nav-item" key={pageName}>
              <NavLink
                className={`nav-link text-white text-capitalize`}
                to={(props.prefix ?? "") + (pageInfo.path ?? `/${pageName}`)}
              >
                {pageName}
              </NavLink>
            </li>
          ))}

          <li className="nav-item mt-auto">
            <button className="btn btn-light w-100 text-capitalize">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
