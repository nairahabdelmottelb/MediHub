import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../index";

// Types for API responses
export interface Timeslot {
  slot_id: number;
  calendar_id: number;
  start_time: string;
  end_time: string;
  is_available: number; // Backend returns 1/0, not boolean
  doctor_id: number;
  doctor_first_name: string;
  doctor_last_name: string;
  department_id: number;
  department_name: string;
}

export interface PatientDoctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  department_name?: string;
  appointment_count: number;
  last_appointment: string;
  statuses: string[];
}

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  slot_id: number;
  appointment_date: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  notes?: string;
  priority_flag: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  patient_first_name?: string;
  patient_last_name?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  department_name?: string;
  start_time?: string;
  end_time?: string;
}

export interface AppointmentCreateRequest {
  slot_id: number;
  notes?: string;
  priority_flag?: boolean;
  patient_id?: number; // Only for doctors/admins creating appointments for patients
}

export interface AppointmentUpdateRequest {
  status?: string;
  notes?: string;
  priority_flag?: boolean;
  slot_id?: number;
}

// Hook to get available timeslots
export const useAvailableTimeslots = (doctorId?: number, selectedDate?: string) => {
  return useQuery({
    queryKey: ["timeslots", "available", doctorId, selectedDate],
    queryFn: async (): Promise<Timeslot[]> => {
      const params = new URLSearchParams();
      if (doctorId) params.append("doctor_id", doctorId.toString());
      // Don't use date filtering in API - we'll filter client-side for better control

      const response = await api.get(`/timeslots/?${params.toString()}`);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute (timeslots change frequently)
  });
};

// Hook to get user's appointments
export const useAppointments = () => {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async (): Promise<Appointment[]> => {
      const response = await api.get("/appointments/");
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get a specific appointment
export const useAppointment = (appointmentId: number) => {
  return useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: async (): Promise<Appointment> => {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response.data;
    },
    enabled: !!appointmentId,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook to create an appointment
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: AppointmentCreateRequest) => {
      const response = await api.post("/appointments/", appointmentData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch appointments and timeslots
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
};

// Hook to update an appointment
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AppointmentUpdateRequest }) => {
      const response = await api.put(`/appointments/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
    },
  });
};

// Hook to cancel an appointment
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await api.delete(`/appointments/${appointmentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
    },
  });
};

// Hook to get patient's doctors from their appointments
export const usePatientDoctors = () => {
  return useQuery({
    queryKey: ["patient-doctors"],
    queryFn: async (): Promise<PatientDoctor[]> => {
      const response = await api.get("/appointments/");
      const appointments: Appointment[] = response.data;

      // Extract unique doctors from appointments
      const doctorsMap = new Map<number, PatientDoctor>();

      appointments.forEach(appointment => {
        if (appointment.doctor_id && appointment.doctor_first_name && appointment.doctor_last_name) {
          const doctorKey = appointment.doctor_id;
          if (!doctorsMap.has(doctorKey)) {
            doctorsMap.set(doctorKey, {
              doctor_id: appointment.doctor_id,
              first_name: appointment.doctor_first_name,
              last_name: appointment.doctor_last_name,
              department_name: appointment.department_name,
              // Count appointments with this doctor
              appointment_count: 1,
              // Get the most recent appointment date
              last_appointment: appointment.start_time || appointment.appointment_date,
              // Get appointment statuses
              statuses: [appointment.status]
            });
          } else {
            // Update existing doctor info
            const doctor = doctorsMap.get(doctorKey)!;
            doctor.appointment_count += 1;
            if (!doctor.statuses.includes(appointment.status)) {
              doctor.statuses.push(appointment.status);
            }
            // Update last appointment if this one is more recent
            const currentDate = new Date(appointment.start_time || appointment.appointment_date);
            const lastDate = new Date(doctor.last_appointment);
            if (currentDate > lastDate) {
              doctor.last_appointment = appointment.start_time || appointment.appointment_date;
            }
          }
        }
      });

      return Array.from(doctorsMap.values());
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
