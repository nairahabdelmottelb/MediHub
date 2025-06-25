import { Link } from "react-router";

export default function Home() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <h1 className="display-4 mb-4">Welcome to MediHub</h1>
          <p className="lead mb-4">
            Your comprehensive healthcare management platform
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/login" className="btn btn-primary btn-lg">
              Login
            </Link>
            <Link
              to="/patientSignup"
              className="btn btn-outline-primary btn-lg"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
