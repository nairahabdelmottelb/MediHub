import { useState } from "react";
import { DashboardContainer } from "../../components/adminDashboard/Containers";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  lastActive: string;
}

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      email: "sarah.johnson@example.com",
      phone: "+1 234 567 8901",
      status: "active",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Neurology",
      email: "michael.chen@example.com",
      phone: "+1 234 567 8902",
      status: "active",
      lastActive: "1 day ago",
    },
    {
      id: 3,
      name: "Dr. Emily Davis",
      specialty: "Pediatrics",
      email: "emily.davis@example.com",
      phone: "+1 234 567 8903",
      status: "inactive",
      lastActive: "1 week ago",
    },
  ]);

  const handleStatusChange = (id: number) => {
    setDoctors(
      doctors.map((doctor) =>
        doctor.id === id
          ? {
              ...doctor,
              status: doctor.status === "active" ? "inactive" : "active",
            }
          : doctor
      )
    );
  };

  return (
    <DashboardContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Doctors</h2>
        <button className="btn btn-primary">
          <i className="fas fa-plus me-2" />
          Add New Doctor
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <i className="fas fa-user-md" />
                        </div>
                        <div>
                          <div className="fw-bold">{doctor.name}</div>
                          <div className="text-muted small">{doctor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{doctor.specialty}</td>
                    <td>{doctor.phone}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          doctor.status === "active" ? "success" : "danger"
                        }`}
                      >
                        {doctor.status}
                      </span>
                    </td>
                    <td>{doctor.lastActive}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="fas fa-edit" />
                        </button>
                        <button className="btn btn-sm btn-outline-info">
                          <i className="fas fa-eye" />
                        </button>
                        <button
                          className={`btn btn-sm btn-outline-${
                            doctor.status === "active" ? "danger" : "success"
                          }`}
                          onClick={() => handleStatusChange(doctor.id)}
                        >
                          <i
                            className={`fas fa-${
                              doctor.status === "active" ? "ban" : "check"
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
