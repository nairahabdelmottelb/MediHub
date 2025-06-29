import { useQuery } from "@tanstack/react-query";
import { api } from "../index";
import { useCurrentDoctor } from "./useCurrentDoctor";
import type { Appointment } from "./useAppointments";

export interface DashboardStats {
  todaysAppointments: number;
  totalPatients: number;
  pendingReviews: number;
  completedToday: number;
}

export interface TodaysAppointment {
  appointment_id: number;
  patient_id: number;
  patient_first_name: string;
  patient_last_name: string;
  start_time: string;
  end_time: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  notes?: string;
  priority_flag: boolean;
  appointment_type?: string;
}

// Hook to get doctor's appointments for today
export const useTodaysAppointments = () => {
  const { data: currentDoctor } = useCurrentDoctor();

  return useQuery({
    queryKey: ["todaysAppointments", currentDoctor?.doctor_id],
    queryFn: async (): Promise<TodaysAppointment[]> => {
      const response = await api.get<Appointment[]>("/appointments/");
      const appointments = response.data;

      // Get patients data - this already includes first_name and last_name from JOIN with USERS table
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

      // Filter for today's appointments for this doctor
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const todaysAppointments = appointments
        .filter(appointment => {
          // Filter by doctor and today's date
          const appointmentDate = appointment.appointment_date.split("T")[0];
          return appointment.doctor_id === currentDoctor?.doctor_id &&
            appointmentDate === todayStr;
        })
        .map(appointment => {
          const patient = patientMap.get(appointment.patient_id);
          return {
            appointment_id: appointment.appointment_id,
            patient_id: appointment.patient_id,
            patient_first_name: patient?.first_name || "Unknown",
            patient_last_name: patient?.last_name || "Patient",
            start_time: appointment.appointment_date,
            end_time: appointment.appointment_date,
            status: appointment.status,
            notes: appointment.notes,
            priority_flag: appointment.priority_flag,
            appointment_type: "General Consultation"
          };
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      return todaysAppointments;
    },
    enabled: !!currentDoctor?.doctor_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get doctor's dashboard statistics
export const useDoctorDashboardStats = () => {
  const { data: currentDoctor } = useCurrentDoctor();

  return useQuery({
    queryKey: ["doctorDashboardStats", currentDoctor?.doctor_id],
    queryFn: async (): Promise<DashboardStats> => {
      // Get all appointments for this doctor
      const appointmentsResponse = await api.get<Appointment[]>("/appointments/");
      const appointments = appointmentsResponse.data.filter(
        appointment => appointment.doctor_id === currentDoctor?.doctor_id
      );

      // Calculate today's date
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Filter today's appointments
      const todaysAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.appointment_date.split("T")[0];
        return appointmentDate === todayStr;
      });

      // Count completed appointments today
      const completedToday = todaysAppointments.filter(
        appointment => appointment.status === "Completed"
      ).length;

      // Count unique patients (this doctor has seen)
      const uniquePatients = new Set(appointments.map(apt => apt.patient_id));
      const totalPatients = uniquePatients.size;

      // Count pending reviews (appointments completed but might need follow-up)
      // For now, we'll count recent completed appointments as pending reviews
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pendingReviews = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date);
        return appointment.status === "Completed" &&
          appointmentDate >= sevenDaysAgo &&
          appointmentDate <= today;
      }).length;

      return {
        todaysAppointments: todaysAppointments.length,
        totalPatients,
        pendingReviews,
        completedToday
      };
    },
    enabled: !!currentDoctor?.doctor_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get recent lab results from medical_records table
export const useRecentLabResults = () => {
  const { data: currentDoctor } = useCurrentDoctor();

  return useQuery({
    queryKey: ["recentLabResults", currentDoctor?.doctor_id],
    queryFn: async () => {
      try {
        // Get patients data - this already includes first_name and last_name from JOIN with USERS table
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

        // Get medical records for all patients that this doctor has created
        const medicalRecordsPromises = patients.map((patient: any) =>
          api.get(`/medical-records/patient/${patient.patient_id}`)
            .then(response => response.data)
            .catch(() => []) // Return empty array if no records found
        );

        const allRecordsArrays = await Promise.all(medicalRecordsPromises);
        const allRecords = allRecordsArrays.flat();

        // Filter records that have lab_results and are from this doctor
        const recentLabResults = allRecords
          .filter((record: any) =>
            record.doctor_id === currentDoctor?.doctor_id &&
            record.lab_results &&
            record.lab_results.trim() !== ""
          )
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10) // Get last 10 lab results
          .map((record: any) => {
            const patient = patientMap.get(record.patient_id);
            return {
              id: record.record_id,
              patientName: patient
                ? `${patient.first_name} ${patient.last_name}`
                : "Unknown Patient",
              testName: record.lab_results.length > 50
                ? record.lab_results.substring(0, 50) + "..."
                : record.lab_results,
              date: new Date(record.created_at),
              status: "new" as const,
              fullResults: record.lab_results,
              diagnosis: record.diagnosis,
            };
          });

        return recentLabResults;
      } catch (error) {
        console.error("Error fetching lab results:", error);
        return [];
      }
    },
    enabled: !!currentDoctor?.doctor_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
