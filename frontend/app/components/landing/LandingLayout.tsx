import Navbar from "./Navbar";
import { Outlet } from "react-router";

export default function LandingLayout() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 56 }}>
        <Outlet />
      </div>
    </>
  );
}
