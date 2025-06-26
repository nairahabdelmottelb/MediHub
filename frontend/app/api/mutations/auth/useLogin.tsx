import { useMutation } from "@tanstack/react-query";
import { api } from "../../index";
import type { AuthInfo } from "~/types/api/auth/AuthInfo";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse extends AuthInfo {}

export const useLogin = () => {
  const mutation = useMutation({
    mutationFn: async (
      credentials: LoginCredentials
    ): Promise<LoginResponse> => {
      const response = await api.post<LoginResponse>("/auth/login/json", {
        email: credentials.email,
        password: credentials.password,
      });
      return response.data;
    },

    onError: (error: any) => {
      console.error("Login failed:", error);
    },
  });

  return mutation;
};
