import { useQuery } from "@tanstack/react-query";
import { api } from "../index";

export interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  appointmentsToday: number;
  revenueThisMonth: number;
}

export interface RecentActivity {
  id: number;
  type: 'doctor_registered' | 'report_generated' | 'maintenance_scheduled' | 'user_created';
  message: string;
  timestamp: string;
  icon: string;
  iconColor: string;
}

export interface SystemStatus {
  serverStatus: 'online' | 'offline';
  databaseStatus: 'connected' | 'disconnected';
  storageUsage: number;
  memoryUsage: number;
}

// Hook to get dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Fetch data from multiple endpoints
        const [doctorsResponse, patientsResponse, appointmentsResponse] = await Promise.all([
          api.get("/doctors"),
          api.get("/patients"),
          api.get("/appointments/") // This will get appointments for the current user
        ]);

        // Filter today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todaysAppointments = appointmentsResponse.data?.filter((appointment: any) => {
          const appointmentDate = new Date(appointment.appointment_date || appointment.date);
          return appointmentDate.toISOString().split('T')[0] === today;
        }) || [];

        return {
          totalDoctors: doctorsResponse.data?.length || 0,
          totalPatients: patientsResponse.data?.length || 0,
          appointmentsToday: todaysAppointments.length,
          revenueThisMonth: 0   // Would need a revenue/analytics endpoint
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          totalDoctors: 0,
          totalPatients: 0,
          appointmentsToday: 0,
          revenueThisMonth: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get recent activity (mock data for now)
export const useRecentActivity = () => {
  return useQuery({
    queryKey: ["recentActivity"],
    queryFn: async (): Promise<RecentActivity[]> => {
      // This would ideally come from a notifications or activity log endpoint
      return [
        {
          id: 1,
          type: 'doctor_registered',
          message: 'New doctor registered: Dr. Sarah Johnson',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: 'fas fa-user-plus',
          iconColor: 'text-success'
        },
        {
          id: 2,
          type: 'report_generated',
          message: 'Monthly report generated',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          icon: 'fas fa-file-alt',
          iconColor: 'text-primary'
        },
        {
          id: 3,
          type: 'maintenance_scheduled',
          message: 'System maintenance scheduled',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: 'fas fa-bell',
          iconColor: 'text-warning'
        }
      ];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get system status (mock data for now)
export const useSystemStatus = () => {
  return useQuery({
    queryKey: ["systemStatus"],
    queryFn: async (): Promise<SystemStatus> => {
      // This would ideally come from a system health endpoint
      return {
        serverStatus: 'online',
        databaseStatus: 'connected',
        storageUsage: 65,
        memoryUsage: 78
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};
