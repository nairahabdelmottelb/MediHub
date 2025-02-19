import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("components/dashboard/DashboardLayout.tsx", [
    index("routes/home/home.tsx"),
    route("calendar", "routes/calendar/calendar.tsx"),
  ]),

  route("welcome", "routes/welcomePage.tsx"),
] satisfies RouteConfig;
