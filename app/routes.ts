import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/landing/welcomePage.tsx"),
  layout("components/dashboard/DashboardLayout.tsx", [
    route("dashboard", "routes/dashboard/home.tsx"),
    route("calendar", "routes/dashboard/calendar/calendar.tsx"),
  ]),
] satisfies RouteConfig;
