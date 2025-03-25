import { NavLink } from "react-router";
import {
  patientDashboardPages,
  type PageTitle,
} from "./patientDashboard/DashboardLayout";
import type DashboardPageInfo from "~/types/DashboardPageInfo";
import {
  Accordion,
  AccordionContext,
  useAccordionButton,
} from "react-bootstrap";
import { useContext } from "react";

interface NavItemProps {
  pageTitle: PageTitle;
  pageInfo: DashboardPageInfo;
}

function SimpleNavItem({ pageTitle, pageInfo }: NavItemProps) {
  return (
    <NavLink
      className="nav-link text-white text-capitalize"
      to={pageInfo.path ?? `/${pageTitle}`}
    >
      {pageTitle}
    </NavLink>
  );
}

function DropdownNavItem({ pageTitle, pageInfo }: NavItemProps) {
  const onClick = useAccordionButton(pageTitle);

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="nav-link text-white text-start text-capitalize"
      >
        {pageTitle}
        <i className="bi bi-chevron-down ms-auto" />
      </button>

      <Accordion.Collapse eventKey={pageTitle}>
        <ul className="nav child-nav flex-column">
          {Object.entries(pageInfo.children!).map(([childPage, childInfo]) => (
            <li className="nav-item" key={childPage}>
              <SimpleNavItem
                key={childPage}
                pageTitle={childPage}
                pageInfo={childInfo}
              />
            </li>
          ))}
        </ul>
      </Accordion.Collapse>
    </>
  );
}

export default function Sidebar(props: {
  pages: Record<string, DashboardPageInfo>;
  prefix?: string;
}) {
  const renderNavItem = ([pageName, pageInfo]: [string, DashboardPageInfo]) => (
    <li className="nav-item" key={pageName}>
      {pageInfo.children ? (
        <DropdownNavItem pageInfo={pageInfo} pageTitle={pageName} />
      ) : (
        <SimpleNavItem pageTitle={pageName} pageInfo={pageInfo} />
      )}
    </li>
  );

  return (
    <nav className="col-md-3 col-lg-2 d-md-flex bg-primary sidebar">
      <Accordion className="d-flex flex-column flex-grow-1">
        <div className="sidebar-header p-4">
          <NavLink to="/">
            <h3 className="text-white">MediHub</h3>
          </NavLink>
          <p className="text-white-50 mb-0">Patient Portal</p>
        </div>

        <ul className="nav flex-column flex-grow-1">
          {/* Navigation items */}
          {Object.entries(props.pages).map(renderNavItem)}
        </ul>

        <button className="btn btn-light w-100 text-capitalize mt-auto">
          Logout
        </button>
      </Accordion>
    </nav>
  );
}
