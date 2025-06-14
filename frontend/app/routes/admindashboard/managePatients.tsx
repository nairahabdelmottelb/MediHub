import { useState } from "react";
import { DashboardContainer } from "../../components/adminDashboard/Containers";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  lastVisit: string;
  status: "active" | "inactive";
}

export default function ManagePatients() {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 1,
      name: "John Smith",
      age: 45,
      gender: "Male",
      email: "john.smith@example.com",
      phone: "+1 234 567 8901",
      lastVisit: "2023-05-15",
      status: "active",
    },
    {
      id: 2,
      name: "Emma Wilson",
      age: 32,
      gender: "Female",
      email: "emma.wilson@example.com",
      phone: "+1 234 567 8902",
      lastVisit: "2023-05-10",
      status: "active",
    },
    {
      id: 3,
      name: "Robert Brown",
      age: 58,
      gender: "Male",
      email: "robert.brown@example.com",
      phone: "+1 234 567 8903",
      lastVisit: "2023-04-20",
      status: "inactive",
    },
  ]);

  const handleStatusChange = (id: number) => {
    setPatients(
      patients.map((patient) =>
        patient.id === id
          ? {
              ...patient,
              status: patient.status === "active" ? "inactive" : "active",
            }
          : patient
      )
    );
  };

  return (
    <DashboardContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Patients</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-success">
            <i className="fas fa-file-import me-2" />
            Import Data
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-plus me-2" />
            Add New Patient
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Contact</th>
                  <th>Last Visit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <i className="fas fa-user" />
                        </div>
                        <div>
                          <div className="fw-bold">{patient.name}</div>
                          <div className="text-muted small">
                            {patient.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.phone}</td>
                    <td>{patient.lastVisit}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          patient.status === "active" ? "success" : "danger"
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
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
                            patient.status === "active" ? "danger" : "success"
                          }`}
                          onClick={() => handleStatusChange(patient.id)}
                        >
                          <i
                            className={`fas fa-${
                              patient.status === "active" ? "ban" : "check"
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
