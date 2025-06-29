import { useQuery } from "@tanstack/react-query";
import { api } from "../index";

export interface CurrentUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name: string;
  phone: string;
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async (): Promise<CurrentUser> => {
      const response = await api.get<CurrentUser>("/users/me");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};
