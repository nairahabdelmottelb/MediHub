import { useState } from "react";
import "./dashboard.css";
import "bootstrap/dist/css/bootstrap.css";
import "./home.tsx";

export default function containers() {
  <>
    <div className="container-sm"></div>
    <div className="container-md"></div>
    <div className="container-lg"></div>
    <div className="container-xl"></div>
    <div className="container-xxl">
      100% wide until extra extra large breakpoint
    </div>
  </>;
}
