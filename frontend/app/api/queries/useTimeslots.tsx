import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../index";

// Types for timeslots
export interface TimeSlot {
  slot_id: number;
  calendar_id: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  doctor_id?: number;
  doctor_name?: string;
  appointment_id?: number;
  patient_name?: string;
  appointment_type?: string;
}

export interface CreateTimeSlotData {
  date: string;
  start_hour: number;
  end_hour: number;
  duration_minutes: number;
}

export interface BulkCreateTimeSlotData {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  weekdays: number[];
  exclude_dates: string[];
}

export interface UpdateTimeSlotData {
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
}

// Hook to get available timeslots
export const useTimeslots = (doctorId?: number, dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ["timeslots", doctorId, dateFrom, dateTo],
    queryFn: async (): Promise<TimeSlot[]> => {
      const params = new URLSearchParams();
      if (doctorId) params.append("doctor_id", doctorId.toString());
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await api.get<TimeSlot[]>(`/timeslots?${params.toString()}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Hook to get doctor's own timeslots
export const useDoctorTimeslots = (doctorId: number, dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ["doctorTimeslots", doctorId, dateFrom, dateTo],
    queryFn: async (): Promise<TimeSlot[]> => {
      const params = new URLSearchParams();
      params.append("doctor_id", doctorId.toString());
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await api.get<TimeSlot[]>(`/timeslots?${params.toString()}`);
      return response.data;
    },
    enabled: !!doctorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Hook to create timeslots for a specific doctor
export const useCreateDoctorTimeslots = (doctorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimeSlotData) => {
      const response = await api.post(`/doctors/${doctorId}/timeslots`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch timeslots
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["doctorTimeslots", doctorId] });
    },
  });
};

// Hook to create bulk timeslots for a specific doctor
export const useCreateBulkDoctorTimeslots = (doctorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCreateTimeSlotData) => {
      const response = await api.post(`/doctors/${doctorId}/bulk-timeslots`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch timeslots
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["doctorTimeslots", doctorId] });
    },
  });
};

// Hook to update a specific timeslot
export const useUpdateTimeslot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, data }: { slotId: number; data: UpdateTimeSlotData }) => {
      const response = await api.put(`/timeslots/${slotId}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch timeslots
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["doctorTimeslots"] });
    },
  });
};

// Hook to delete a specific timeslot
export const useDeleteTimeslot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: number) => {
      const response = await api.delete(`/timeslots/${slotId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch timeslots
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["doctorTimeslots"] });
    },
  });
};

// Hook to get specific timeslot details
export const useTimeslot = (slotId: number) => {
  return useQuery({
    queryKey: ["timeslot", slotId],
    queryFn: async (): Promise<TimeSlot> => {
      const response = await api.get<TimeSlot>(`/timeslots/${slotId}`);
      return response.data;
    },
    enabled: !!slotId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook to create a single timeslot (for breaks or unavailable periods)
export const useCreateTimeslot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      calendar_id: number;
      start_time: string;
      end_time: string;
      is_available: boolean;
    }) => {
      const response = await api.post(`/timeslots/`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch timeslots
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["doctorTimeslots"] });
    },
  });
};

// Hook to create a doctor's calendar
export const useCreateDoctorCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorId: number) => {
      const response = await api.post(`/doctors/${doctorId}/calendar`, {
        availability: true
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch doctor data
      queryClient.invalidateQueries({ queryKey: ["currentDoctor"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
};
