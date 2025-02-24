import { NavLink } from "react-router";
import { dashboardPages, type PageTitle } from "./DashboardLayout";

export default function Sidebar(props: { handleNavClick: (s : PageTitle) => void; activeSection: PageTitle }) {
    return (
        <nav className="col-md-3 col-lg-2 d-md-block bg-primary sidebar min-vh-100">
            <div className="position-sticky">
                <div className="sidebar-header p-4">
                    <h3 className="text-white">MediHub</h3>
                    <p className="text-white-50 mb-0">Patient Portal</p>
                </div>
                <ul className="nav flex-column">
                    {Object.entries(dashboardPages).map(([pageName, pageInfo]) => (
                        <li className="nav-item" key={pageName}>
                            <NavLink
                                className={`nav-link text-white text-capitalize`}
                                to={pageInfo.path ?? `/${pageName}`}
                            >
                                {pageName}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
