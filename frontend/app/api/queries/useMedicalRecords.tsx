import { useQuery } from "@tanstack/react-query";
import { api } from "../index";
import { useCurrentPatientInfo } from "./useMedications";

export interface MedicalRecord {
  record_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number | null;
  diagnosis: string;
  prescriptions?: string | null;
  lab_results?: string | null;
  created_at: string;
  doctor?: {
    first_name: string;
    last_name: string;
  };
}

export const useCurrentPatientMedicalRecords = () => {
  const { data: patientInfo } = useCurrentPatientInfo();

  return useQuery({
    queryKey: ["currentPatientMedicalRecords", patientInfo?.patient_id],
    queryFn: async (): Promise<MedicalRecord[]> => {
      if (!patientInfo?.patient_id) {
        throw new Error("Patient ID not available");
      }

      const response = await api.get<MedicalRecord[]>(`/medical-records/patient/${patientInfo.patient_id}`);
      return response.data;
    },
    enabled: !!patientInfo?.patient_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

export const usePatientMedicalRecords = (patientId: number) => {
  return useQuery({
    queryKey: ["patientMedicalRecords", patientId],
    queryFn: async (): Promise<MedicalRecord[]> => {
      const response = await api.get<MedicalRecord[]>(`/medical-records/patient/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
