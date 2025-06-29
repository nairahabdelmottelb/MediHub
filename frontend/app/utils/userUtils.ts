import type { CurrentUser } from "../api/queries/useCurrentUser";

export const getRoleBasedDashboardPath = (user: CurrentUser): string => {
  const roleName = user.role_name.toLowerCase();

  switch (roleName) {
    case "admin":
      return "/admin/dashboard";
    case "doctor":
      return "/doctor/dashboard";
    case "patient":
      return "/patient/dashboard";
    default:
      // Default to patient dashboard if role is unknown
      return "/patient/dashboard";
  }
};

export const getFullName = (user: CurrentUser): string => {
  return `${user.first_name} ${user.last_name}`.trim();
};
