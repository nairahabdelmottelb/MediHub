import React from "react";

interface DoctorDashboardHeroProps {
  bgSrc?: string;
  doctorName: string;
  totalAppointments: number;
  children?: React.ReactNode;
}

const DoctorDashboardHero: React.FC<DoctorDashboardHeroProps> = ({
  bgSrc,
  doctorName,
  totalAppointments,
}) => {
  return (
    <section
      className="dashboard-hero"
      style={{
        backgroundImage: `url(${bgSrc})`,
      }}
    >
      <div className="dashboard-overlay">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <div className="booking-card p-4 rounded">
                <div className="text-white mb-4 container text-center">
                  <h1 className="font-bold"> {doctorName} </h1>
                  <p className="mt-2 fs-4">
                    You have{" "}
                    <span className="font-semibold">{totalAppointments}</span>{" "}
                    upcoming appointments today.
                  </p>
                  <div className="d-flex mt-4 justify-content-center column-gap-4 row-gap-2 flex-wrap">
                    <button className="btn btn-light btn-lg px-5 py-3">
                      View Appointments
                    </button>
                    <button className="btn btn-light btn-lg px-5 py-3">
                      Manage Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorDashboardHero;
