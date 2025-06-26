import { useMutation } from "@tanstack/react-query";
import { api } from "~/api";

export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  date_of_birth: string;
  blood_type: string;
  gender: string;
}

interface SignUpResponse {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  message: string;
}

export const useSignUp = () => {
  const mutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      const response = await api.post<SignUpResponse>("/auth/signup", data);

      return response.data;
    },
  });

  return mutation;
};
