import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("components/landing/LandingLayout.tsx", [
    index("routes/landing/welcomePage.tsx"),
    route("login", "routes/login/login.tsx"),
  ]),
  layout("components/dashboard/DashboardLayout.tsx", [
    route("dashboard", "routes/dashboard/home.tsx"),
    route("calendar", "routes/dashboard/calendar.tsx"),
    route("alerts", "routes/dashboard/alerts.tsx"),
    route("tests", "routes/dashboard/tests.tsx"),
    route("history", "routes/dashboard/history.tsx"),
    route("medications", "routes/dashboard/medications.tsx"),
    route("doctors", "routes/dashboard/doctors.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
  ]),
] satisfies RouteConfig;
