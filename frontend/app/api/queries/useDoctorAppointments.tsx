import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../index";
import { useCurrentDoctor } from "./useCurrentDoctor";
import axios from "axios";

export interface DoctorAppointment {
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  appointment_date: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes: string;
  priority_flag: boolean;
  slot_id: number;
}

// Hook to get all appointments for the current doctor
export const useDoctorAppointments = () => {
  const { data: currentDoctor } = useCurrentDoctor();

  return useQuery({
    queryKey: ["doctorAppointments", currentDoctor?.doctor_id],
    queryFn: async (): Promise<DoctorAppointment[]> => {
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

        // Get appointments for this doctor
        const appointmentsResponse = await api.get("/appointments/");
        const appointments = appointmentsResponse.data;

        // Filter and transform appointments for this doctor
        const doctorAppointments = appointments
          .filter((appointment: any) => appointment.doctor_id === currentDoctor?.doctor_id)
          .sort((a: any, b: any) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
          .map((appointment: any) => {
            const patient = patientMap.get(appointment.patient_id);
            return {
              appointment_id: appointment.appointment_id,
              patient_id: appointment.patient_id,
              patient_name: patient
                ? `${patient.first_name} ${patient.last_name}`
                : "Unknown Patient",
              appointment_date: appointment.appointment_date,
              status: appointment.status,
              notes: appointment.notes || "",
              priority_flag: appointment.priority_flag || false,
              slot_id: appointment.slot_id
            };
          });

        return doctorAppointments;
      } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
    },
    enabled: !!currentDoctor?.doctor_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to summarize appointment notes
export const useSummarizeNotes = () => {
  return useMutation({
    mutationFn: async (notes: string): Promise<string> => {
      try {
        // Simulate API call to summarization service
        const response = await axios.post('https://api.local/summarize', {
          text: notes,
          type: 'medical_notes'
        });
        
        return response.data.summary;
      } catch (error) {
        // Simulate a successful response for demo purposes
        console.log("Simulating summarization API call for:", notes);
        
        // Create a mock summary based on the notes content
        const mockSummary = generateMockSummary(notes);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return mockSummary;
      }
    }
  });
};

// Helper function to generate mock summary
function generateMockSummary(notes: string): string {
  if (!notes || notes.trim() === "") {
    return "No notes to summarize.";
  }
  
  const words = notes.trim().split(/\s+/);
  
  if (words.length <= 10) {
    return `Brief note: ${notes}`;
  }
  
  // Create a mock summary by extracting key medical terms and creating a concise version
  const medicalTerms = notes.match(/\b(patient|appointment|symptoms|treatment|medication|diagnosis|follow.?up|examination|test|results|prescription|condition|pain|fever|blood pressure|heart rate)\b/gi) || [];
  
  const uniqueTerms = [...new Set(medicalTerms.map(term => term.toLowerCase()))];
  
  if (uniqueTerms.length > 0) {
    return `Summary: ${notes.substring(0, 50)}... Key areas discussed: ${uniqueTerms.slice(0, 3).join(', ')}.`;
  }
  
  // Fallback summary
  return `Summary: ${notes.substring(0, 80)}${notes.length > 80 ? '...' : ''}`;
}
