import { Route, Routes } from "react-router";
import Home from "./home";
import Login from "./login";
import Register from "./register";

export default function RootRoute() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
