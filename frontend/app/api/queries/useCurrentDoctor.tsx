import { useQuery } from "@tanstack/react-query";
import { api } from "../index";
import { useCurrentUser } from "./useCurrentUser";

export interface CurrentDoctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  years_of_exp: number;
  spec_id: number;
  spec_name: string;
  department_id: number;
  department_name: string;
  calendar?: {
    calendar_id: number;
    availability: boolean;
  };
}

export const useCurrentDoctor = () => {
  const { data: currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ["currentDoctor", currentUser?.user_id],
    queryFn: async (): Promise<CurrentDoctor> => {
      // First get all doctors, then find the current user's doctor record
      const response = await api.get<CurrentDoctor[]>("/doctors");
      const doctors = response.data;

      const currentDoctor = doctors.find(doc => doc.email === currentUser?.email);
      if (!currentDoctor) {
        throw new Error("Doctor record not found for current user");
      }

      // Get detailed doctor info including calendar
      const detailResponse = await api.get<CurrentDoctor>(`/doctors/${currentDoctor.doctor_id}`);
      return detailResponse.data;
    },
    enabled: !!currentUser && currentUser.role_name === "doctor",
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};
