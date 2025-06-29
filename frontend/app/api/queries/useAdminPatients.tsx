import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../index";

export interface AdminPatient {
  patient_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_type: string | null;
  insurance_provider: string | null;
}

export interface CreatePatientData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact_number: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
}

// Hook to get all patients (admin only)
export const useAllPatients = () => {
  return useQuery({
    queryKey: ["allPatients"],
    queryFn: async (): Promise<AdminPatient[]> => {
      const response = await api.get<AdminPatient[]>("/patients");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook to create a new patient (admin only)
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientData: CreatePatientData) => {
      // Use the signup endpoint which creates both user and patient
      const response = await api.post("/auth/signup", patientData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ["allPatients"] });
    },
  });
};

// Hook to get a specific patient (admin only)
export const usePatientById = (patientId: number) => {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: async (): Promise<AdminPatient> => {
      const response = await api.get<AdminPatient>(`/patients/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook to update patient status or information
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, data }: { patientId: number; data: Partial<AdminPatient> }) => {
      const response = await api.put(`/patients/${patientId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPatients"] });
    },
  });
};

// Hook to delete a patient (admin only)
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: number) => {
      const response = await api.delete(`/patients/${patientId}`);
      return response.data;
    },
    onSuccess: (data, patientId) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ["allPatients"] });
      // Remove the specific patient from cache
      queryClient.removeQueries({ queryKey: ["patient", patientId] });
    },
  });
};
