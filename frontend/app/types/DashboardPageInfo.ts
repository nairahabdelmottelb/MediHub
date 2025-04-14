import type { ReactNode } from "react";

interface DashboardPageInfo {
  bg: string;
  icon?: string;
  title?: string;
  description?: string;
  children?: Record<string, DashboardPageInfo>;
  path?: string;
  heroChildren?: ReactNode;
}

// Create a const to export as a value while preserving the type
const DashboardPageInfo = {} as const;

// Export both the type and the value
export type { DashboardPageInfo };
export default DashboardPageInfo;
