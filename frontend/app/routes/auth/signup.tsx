import React from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link } from "react-router";

export default function SignupPage() {
  return (
    <div className="d-flex justify-content-center py-4 h-100" style={{ backgroundImage: "url('/images/support.jpg')" }}>
      <Card style={{ maxWidth: "600px" }} className="my-auto w-100 p-4 shadow">
        <h4 className="mb-4 text-center">Sign Up</h4>
        <Form>
          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" placeholder="Enter email" />
          </Form.Group>

          <Form.Group controlId="password" className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Enter password" />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Group controlId="firstName">
                <Form.Label>First Name</Form.Label>
                <Form.Control type="text" placeholder="First name" />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="lastName">
                <Form.Label>Last Name</Form.Label>
                <Form.Control type="text" placeholder="Last name" />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group controlId="contactNumber">
                <Form.Label>Contact Number</Form.Label>
                <Form.Control type="tel" placeholder="Contact number" />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="dateOfBirth">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control type="date" />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <Form.Group controlId="gender">
                <Form.Label>Gender</Form.Label>
                <Form.Select>
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
                <Form.Select>
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
            <Button variant="success" type="submit">
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
