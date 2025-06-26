import { NavLink } from "react-router";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-md navbar-light bg-white shadow-sm fixed-top">
      <div className="container">
        <NavLink
          className="navbar-brand text-primary fw-bold d-flex align-items-center"
          to="/"
        >
          <img
            src="/logo/MediHub.png"
            alt="MediHub Logo"
            style={{ height: 70, marginRight: 10 }}
          />
          MediHub
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="#about">
                About Us
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#doctors">
                Our Doctors
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#services">
                Our Services
              </a>
            </li>
          </ul>
          <div className="d-flex gap-2">
            <NavLink className="btn btn-outline-primary" to={"/login"}>
              Login
            </NavLink>
<<<<<<< HEAD
            <button className="btn btn-primary">Sign Up</button>
=======
            <NavLink
              className="btn btn-primary"
              to={"/signup"}
            >
              Sign Up
            </NavLink>
>>>>>>> 715166af8d97eae49da159d34476d11d5e82980a
          </div>
        </div>
      </div>
    </nav>
  );
}
