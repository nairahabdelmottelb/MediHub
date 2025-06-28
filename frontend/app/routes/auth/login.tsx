import React from "react";
import { Form, Button, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useLogin } from "~/api/mutations/auth/useLogin";
import { useAuthStore } from "~/store/auth.state";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: login, isPending } = useLogin();
  const { setAuthInfo } = useAuthStore();

  const onLogin = (loginCredentials: LoginFormValues) => {
    console.log("Login attempt with:", loginCredentials);

    login(loginCredentials, {
      onSuccess: (response) => {
        setAuthInfo(response);
        navigate("/patient/dashboard");
      },
    });
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center h-100"
      style={{ backgroundImage: "url('/images/signin.jpg')" }}
    >
      <Card style={{ maxWidth: "400px" }} className="w-100 p-4 shadow">
        <h4 className="mb-4 text-center">Login</h4>
        <Form onSubmit={handleSubmit(onLogin)}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="text"
              {...register("email")}
              placeholder="Enter Email"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              {...register("password")}
              placeholder="Enter password"
            />
          </Form.Group>

          <div className="d-grid">
            <Button disabled={isPending} variant="primary" type="submit">
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
