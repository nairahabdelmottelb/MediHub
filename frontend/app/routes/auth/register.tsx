import React from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { useSignUp, type SignUpData } from "~/api/mutations/auth/useSignup";
import Footer from "../../components/landing/Footer";

interface SignupFormValues extends SignUpData {}

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<SignupFormValues>({});

  const { mutate: signup, isPending } = useSignUp();

  const onSubmit = (data: SignupFormValues) => {
    console.log("Signup attempt with:", data);

    signup(data, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center h-100"
      style={{
        backgroundImage: "url('/images/signup.jpg')",
        minHeight: "115vh",
      }}
    >
      <Card
        style={{
          maxWidth: "500px",
          minHeight: "90px",
          padding: "2rem 2rem",
          marginTop: "10vh",
        }}
        className="w-100 shadow"
      >
        <h4 className="mb-4 text-center">Sign Up</h4>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              {...register("email")}
              placeholder="Enter email"
            />
          </Form.Group>

          <Form.Group controlId="password" className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              {...register("password")}
              placeholder="Enter password"
            />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Group controlId="firstName">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  {...register("first_name")}
                  placeholder="First name"
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="lastName">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  {...register("last_name")}
                  placeholder="Last name"
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="contactNumber">
                <Form.Label>Contact Number</Form.Label>
                <Form.Control
                  type="tel"
                  {...register("contact_number")}
                  placeholder="Contact number"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group controlId="dateOfBirth">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control type="date" {...register("date_of_birth")} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="gender">
                <Form.Label>Gender</Form.Label>
                <Form.Select {...register("gender")}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="bloodType">
                <Form.Label>Blood Type</Form.Label>
                <Form.Select {...register("blood_type")}>
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-grid">
            <Button disabled={isPending} variant="success" type="submit">
              Sign Up
            </Button>
          </div>

          <div className="text-center mt-3">
            <span>Already have an account? </span>
            <Link to="/login">Login</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
