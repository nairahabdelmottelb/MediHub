import type { ReactNode } from "react";

export default interface DashboardPageInfo {
  bg: string;
  children?: Record<string, DashboardPageInfo>;
  path?: string;
  heroChildren?: ReactNode;
}
