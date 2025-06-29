import { useQuery } from "@tanstack/react-query";
import { api } from "../index";
import { useCurrentDoctor } from "./useCurrentDoctor";

export interface PatientRecord {
  record_id: number;
  patient_id: number;
  patient_name: string;
  appointment_id: number | null;
  appointment_date: string | null;
  diagnosis: string;
  prescriptions: string;
  lab_results: string;
  created_at: string;
  record_type: string;
  status: 'active' | 'archived';
}

// Hook to get all patient records for the current doctor
export const useDoctorPatientRecords = () => {
  const { data: currentDoctor } = useCurrentDoctor();

  return useQuery({
    queryKey: ["doctorPatientRecords", currentDoctor?.doctor_id],
    queryFn: async (): Promise<PatientRecord[]> => {
      try {
        // Get patients data to map patient_id to names
        const patientsResponse = await api.get("/patients");
        const patients = patientsResponse.data;
        const patientMap = new Map();

        // Create patient map with the data we already have
        patients.forEach((patient: any) => {
          patientMap.set(patient.patient_id, {
            first_name: patient.first_name,
            last_name: patient.last_name
          });
        });

        // Get appointments for this doctor to link records with appointments
        const appointmentsResponse = await api.get("/appointments/");
        const appointments = appointmentsResponse.data;
        const appointmentMap = new Map();

        appointments
          .filter((apt: any) => apt.doctor_id === currentDoctor?.doctor_id)
          .forEach((apt: any) => {
            appointmentMap.set(apt.appointment_id, {
              appointment_date: apt.appointment_date,
              status: apt.status
            });
          });

        // Get medical records for all patients that this doctor has created
        const medicalRecordsPromises = patients.map((patient: any) =>
          api.get(`/medical-records/patient/${patient.patient_id}`)
            .then(response => response.data)
            .catch(() => []) // Return empty array if no records found
        );

        const allRecordsArrays = await Promise.all(medicalRecordsPromises);
        const allRecords = allRecordsArrays.flat();

        // Filter records that are from this doctor and transform them
        const doctorRecords = allRecords
          .filter((record: any) => record.doctor_id === currentDoctor?.doctor_id)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((record: any) => {
            const patient = patientMap.get(record.patient_id);
            const appointment = appointmentMap.get(record.appointment_id);

            // Determine record type based on content
            let recordType = "General Record";
            if (record.lab_results && record.lab_results.trim()) {
              recordType = "Lab Results";
            } else if (record.prescriptions && record.prescriptions.trim()) {
              recordType = "Prescription";
            } else if (record.diagnosis && record.diagnosis.trim()) {
              recordType = "Diagnosis";
            }

            return {
              record_id: record.record_id,
              patient_id: record.patient_id,
              patient_name: patient
                ? `${patient.first_name} ${patient.last_name}`
                : "Unknown Patient",
              appointment_id: record.appointment_id,
              appointment_date: appointment?.appointment_date || null,
              diagnosis: record.diagnosis || "",
              prescriptions: record.prescriptions || "",
              lab_results: record.lab_results || "",
              created_at: record.created_at,
              record_type: recordType,
              status: (appointment?.status === "Completed" ? "active" : "archived") as 'active' | 'archived'
            };
          });

        return doctorRecords;
      } catch (error) {
        console.error("Error fetching patient records:", error);
        return [];
      }
    },
    enabled: !!currentDoctor?.doctor_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
