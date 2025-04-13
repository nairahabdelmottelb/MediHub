import Navbar from "./Navbar";
import { Outlet } from "react-router";

export default function LandingLayout() {
  return (
    <>
      <Navbar />
      <div className="vh-100" style={{ paddingTop: 56 }}>
        <Outlet />
      </div>
    </>
  );
}
