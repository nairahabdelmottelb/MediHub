import React from "react";

interface DoctorDashboardHeroProps {
  doctorName: string;
  totalAppointments: number;
}

const DoctorDashboardHero: React.FC<DoctorDashboardHeroProps> = ({
  doctorName,
  totalAppointments,
}) => {
  return (
    <section className="bg-blue-500 text-white p-6 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold">Welcome, Dr. {doctorName} 👋</h1>
      <p className="mt-2 text-lg">
        You have <span className="font-semibold">{totalAppointments}</span>{" "}
        upcoming appointments today.
      </p>
      <div className="mt-4 flex space-x-4">
        <button className="bg-white text-blue-500 px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-100">
          View Appointments
        </button>
        <button className="bg-white text-blue-500 px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-100">
          Manage Schedule
        </button>
      </div>
    </section>
  );
};

export default DoctorDashboardHero;
