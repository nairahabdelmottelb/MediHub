import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("components/LandingLayout.tsx", [
    index("routes/landing/welcomePage.tsx"),
    route("login", "routes/login.tsx"),
  ]),
  layout("components/dashboard/DashboardLayout.tsx", [
    route("dashboard", "routes/dashboard/home.tsx"),
    route("calendar", "routes/dashboard/calendar/calendar.tsx"),
    route("alerts", "routes/dashboard/alerts.tsx"),
    route("settings", "routes/dashboard/settings.tsx"),
  ]),
] satisfies RouteConfig;
