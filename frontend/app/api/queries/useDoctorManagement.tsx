import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../index";

// Types for API responses
export interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  years_of_exp: number;
  spec_id: number;
  spec_name: string;
  department_id: number;
  department_name: string;
}

export interface DoctorCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  address?: string;
  specialty: string;
  department_id?: number;
  qualifications: string;
  years_of_experience: number;
}

export interface Department {
  department_id: number;
  department_name: string;
}

export interface Specialization {
  spec_id: number;
  spec_name: string;
}

// Hooks for Doctors
export const useDoctors = () => {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async (): Promise<Doctor[]> => {
      const response = await api.get("/doctors");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDoctor = (doctorId: number) => {
  return useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async (): Promise<Doctor> => {
      const response = await api.get(`/doctors/${doctorId}`);
      return response.data;
    },
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorData: DoctorCreateRequest) => {
      const response = await api.post("/doctors/", doctorData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch doctors list
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
};

export const useUpdateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DoctorCreateRequest> }) => {
      const response = await api.put(`/doctors/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", variables.id] });
    },
  });
};

export const useDeleteDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorId: number) => {
      const response = await api.delete(`/doctors/${doctorId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
};

// Hooks for Departments
export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async (): Promise<Department[]> => {
      const response = await api.get("/departments/");
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (departments change infrequently)
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentData: { department_name: string }) => {
      const response = await api.post("/departments/", departmentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// Hooks for Specializations
export const useSpecializations = () => {
  return useQuery({
    queryKey: ["specializations"],
    queryFn: async (): Promise<Specialization[]> => {
      const response = await api.get("/specializations");
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (specializations change infrequently)
  });
};

export const useCreateSpecialization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (specializationData: { spec_name: string }) => {
      const response = await api.post("/specializations", specializationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
    },
  });
};
