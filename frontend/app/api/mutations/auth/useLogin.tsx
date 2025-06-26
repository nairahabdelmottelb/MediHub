import { useMutation } from "@tanstack/react-query";
import { api } from "../../index";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  role_id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}


export const useLogin = () => {
  const mutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await api.post<LoginResponse>("/login/json", {
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
