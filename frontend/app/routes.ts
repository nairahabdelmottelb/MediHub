import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  layout("components/landing/LandingLayout.tsx", [
    index("routes/landing/welcomePage.tsx"),
    route("login", "routes/login/login.tsx"),
  ]),
  route("patient", "components/patientDashboard/DashboardLayout.tsx", [
    route("dashboard", "routes/patientDashboard/home.tsx"),
    route("calendar", "routes/patientDashboard/calendar.tsx"),
    route("alerts", "routes/patientDashboard/alerts.tsx"),
    route("tests", "routes/patientDashboard/tests.tsx"),
    route("history", "routes/patientDashboard/history.tsx"),
    route("medications", "routes/patientDashboard/medications.tsx"),
    route("doctors", "routes/patientDashboard/doctors.tsx"),
  ]),
  route("doctor", "components/doctorDashboard/DocDashboardLayout.tsx", [
    route("dashboard", "routes/doctorDashboard/drDashboard.tsx"),
  ]),
] satisfies RouteConfig;
