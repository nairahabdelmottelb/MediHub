import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../index";

export interface UpdateMedicationData {
  medication_name?: string;
  dosage?: string;
}

export const useUpdateMedication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, medicationId, data }: {
      patientId: number;
      medicationId: number;
      data: UpdateMedicationData;
    }) => {
      const response = await api.put(`/patients/${patientId}/medications/${medicationId}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["doctorPatientMedications"] });
      queryClient.invalidateQueries({ queryKey: ["patientMedications"] });
    },
    onError: (error) => {
      console.error("Error updating medication:", error);
    },
  });
};
