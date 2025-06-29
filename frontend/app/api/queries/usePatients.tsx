import { useQuery } from "@tanstack/react-query";
import { api } from "../index";

export interface Patient {
  patient_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
  insurance_provider?: string;
}

export interface PatientSearchResult {
  patient_id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
}

// Hook to get all patients (for doctors/admins)
export const usePatients = () => {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async (): Promise<Patient[]> => {
      const response = await api.get<Patient[]>("/patients");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook to get a specific patient
export const usePatient = (patientId: number) => {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: async (): Promise<Patient> => {
      const response = await api.get<Patient>(`/patients/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Hook to search patients by email or name (for creating appointments)
export const useSearchPatients = (searchTerm: string) => {
  return useQuery({
    queryKey: ["patients", "search", searchTerm],
    queryFn: async (): Promise<PatientSearchResult[]> => {
      const response = await api.get<Patient[]>("/patients");
      const patients = response.data;

      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      // Filter patients based on search term
      return patients
        .filter(patient =>
          patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(patient => ({
          patient_id: patient.patient_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          email: patient.email,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          blood_type: patient.blood_type
        }))
        .slice(0, 10); // Limit to 10 results
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};
