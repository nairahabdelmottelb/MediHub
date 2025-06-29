import { useQuery } from "@tanstack/react-query";
import { api } from "../index";
import { useCurrentDoctor } from "./useCurrentDoctor";

export interface DoctorLabTest {
  record_id: number;
  patient_id: number;
  patient_name: string;
  appointment_id: number | null;
  appointment_date: string | null;
  test_name: string;
  lab_results: string;
  diagnosis: string;
  created_at: string;
  status: 'completed' | 'pending';
  result_summary: string;
}

// Hook to get lab tests for patients who have appointments with the current doctor
export const useDoctorLabTests = () => {
  const { data: currentDoctor } = useCurrentDoctor();

  return useQuery({
    queryKey: ["doctorLabTests", currentDoctor?.doctor_id],
    queryFn: async (): Promise<DoctorLabTest[]> => {
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

        // Get appointments for this doctor to filter patients
        const appointmentsResponse = await api.get("/appointments/");
        const appointments = appointmentsResponse.data;
        const doctorPatients = new Set();
        const appointmentMap = new Map();

        // Get all patients who have appointments with this doctor
        appointments
          .filter((apt: any) => apt.doctor_id === currentDoctor?.doctor_id)
          .forEach((apt: any) => {
            doctorPatients.add(apt.patient_id);
            appointmentMap.set(apt.appointment_id, {
              appointment_date: apt.appointment_date,
              status: apt.status,
              patient_id: apt.patient_id
            });
          });

        // Get medical records for patients who have appointments with this doctor
        const medicalRecordsPromises = Array.from(doctorPatients).map((patient_id: any) =>
          api.get(`/medical-records/patient/${patient_id}`)
            .then(response => response.data)
            .catch(() => []) // Return empty array if no records found
        );

        const allRecordsArrays = await Promise.all(medicalRecordsPromises);
        const allRecords = allRecordsArrays.flat();

        // Filter records that have lab_results and are from this doctor
        const labTests = allRecords
          .filter((record: any) =>
            record.doctor_id === currentDoctor?.doctor_id &&
            record.lab_results &&
            record.lab_results.trim() !== ""
          )
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((record: any) => {
            const patient = patientMap.get(record.patient_id);
            const appointment = appointmentMap.get(record.appointment_id);

            // Extract test name from lab results (first line or first 50 characters)
            const labResultsLines = record.lab_results.split('\n');
            const testName = labResultsLines[0].length > 50
              ? labResultsLines[0].substring(0, 50) + "..."
              : labResultsLines[0];

            // Create a summary of results
            const resultSummary = record.lab_results.length > 100
              ? record.lab_results.substring(0, 100) + "..."
              : record.lab_results;

            return {
              record_id: record.record_id,
              patient_id: record.patient_id,
              patient_name: patient
                ? `${patient.first_name} ${patient.last_name}`
                : "Unknown Patient",
              appointment_id: record.appointment_id,
              appointment_date: appointment?.appointment_date || null,
              test_name: testName,
              lab_results: record.lab_results,
              diagnosis: record.diagnosis || "",
              created_at: record.created_at,
              status: 'completed' as const, // All lab results in records are completed
              result_summary: resultSummary
            };
          });

        return labTests;
      } catch (error) {
        console.error("Error fetching lab tests:", error);
        return [];
      }
    },
    enabled: !!currentDoctor?.doctor_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
