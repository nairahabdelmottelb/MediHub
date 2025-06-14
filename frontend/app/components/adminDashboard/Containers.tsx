import type { ReactNode } from "react";

interface DashboardContainerProps {
  children: ReactNode;
}

export function DashboardContainer({ children }: DashboardContainerProps) {
  return (
    <div className="dashboard-container">
      <div className="container-fluid py-4">{children}</div>
    </div>
  );
}
