import React from "react";
import { Form, Button, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle login logic here, e.g., API call
    // On success, navigate to the desired page
    navigate("/patient/dashboard");
  };

  return (
    <div className="d-flex justify-content-center align-items-center h-100" style={{ backgroundImage: "url('/images/support.jpg')" }}>
      <Card style={{ maxWidth: "400px" }} className="w-100 p-4 shadow">
        <h4 className="mb-4 text-center">Login</h4>
        <Form onSubmit={handleLogin}>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control type="text" placeholder="Enter username" />
          </Form.Group>

          <Form.Group controlId="password" className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Enter password" />
          </Form.Group>

          <div className="d-grid">
            <Button variant="primary" type="submit">
              Login
            </Button>
          </div>

          <div className="text-center mt-3">
            <span>Don't have an account? </span>
            <Link to="/signup">Sign up</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
