import { useQuery } from "@tanstack/react-query";
import { api } from "../index";
import { useCurrentUser } from "./useCurrentUser";

export interface Medication {
  medication_id: number;
  patient_id: number;
  medication_name: string;
  dosage: string;
}

// Extended interface for doctor's view of patient medications
export interface DoctorPatientMedication {
  medication_id: number;
  patient_id: number;
  medication_name: string;
  dosage: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  date_of_birth: string;
  gender: string;
  blood_type: string | null;
  last_appointment: string;
  appointment_status: string;
}

export interface DoctorInfo {
  doctor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  spec_name: string;
  department_name: string;
}

export interface DoctorPatientMedicationsResponse {
  doctor: DoctorInfo;
  medications: DoctorPatientMedication[];
  total_medications: number;
}

export interface PatientInfo {
  patient_id: number;
  user_id: number;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  insurance_id: number | null;
  data_anonym_flag: boolean;
}

// Hook to get the current patient's patient_id and info
export const useCurrentPatientInfo = () => {
  const { data: currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ["currentPatientInfo", currentUser?.user_id],
    queryFn: async (): Promise<PatientInfo> => {
      const response = await api.get<PatientInfo>(`/users/me/patient`);
      return response.data;
    },
    enabled: !!currentUser && currentUser.role_name === "patient",
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

export const useCurrentPatientMedications = () => {
  const { data: patientInfo } = useCurrentPatientInfo();

  return useQuery({
    queryKey: ["currentPatientMedications", patientInfo?.patient_id],
    queryFn: async (): Promise<Medication[]> => {
      if (!patientInfo?.patient_id) {
        throw new Error("Patient ID not available");
      }

      const response = await api.get<Medication[]>(`/patients/${patientInfo.patient_id}/medications`);
      return response.data;
    },
    enabled: !!patientInfo?.patient_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

export const usePatientMedications = (patientId: number) => {
  return useQuery({
    queryKey: ["patientMedications", patientId],
    queryFn: async (): Promise<Medication[]> => {
      const response = await api.get<Medication[]>(`/patients/${patientId}/medications`);
      return response.data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook for doctors to get medications of their patients
export const useDoctorPatientMedications = (doctorId?: number) => {
  return useQuery({
    queryKey: ["doctorPatientMedications", doctorId],
    queryFn: async (): Promise<DoctorPatientMedicationsResponse> => {
      if (!doctorId) {
        throw new Error("Doctor ID not available");
      }

      const response = await api.get<DoctorPatientMedicationsResponse>(`/doctors/${doctorId}/patients/medications`);
      return response.data;
    },
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
