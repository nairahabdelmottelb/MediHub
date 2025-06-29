import { useState } from "react";
import { DashboardContainer } from "../../components/adminDashboard/Containers";
import { useAllPatients, useCreatePatient, useDeletePatient, type AdminPatient, type CreatePatientData } from "../../api/queries/useAdminPatients";

export default function ManagePatients() {
  const { data: patients, isLoading, error, refetch } = useAllPatients();
  const createPatientMutation = useCreatePatient();
  const deletePatientMutation = useDeletePatient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<AdminPatient | null>(null);

  const [newPatientData, setNewPatientData] = useState<CreatePatientData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    contact_number: "",
    date_of_birth: "",
    gender: "Male",
    blood_type: "",
  });

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatientMutation.mutateAsync(newPatientData);
      setShowAddModal(false);
      setNewPatientData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        contact_number: "",
        date_of_birth: "",
        gender: "Male",
        blood_type: "",
      });
      refetch(); // Refresh the patient list
    } catch (error) {
      console.error("Error creating patient:", error);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleViewPatient = (patient: AdminPatient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const handleDeletePatient = (patient: AdminPatient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      await deletePatientMutation.mutateAsync(patientToDelete.patient_id);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      refetch(); // Refresh the patient list
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardContainer>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error loading patients: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Patients</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
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
                  <th>Blood Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients?.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <i className="fas fa-user" />
                        </div>
                        <div>
                          <div className="fw-bold">{patient.first_name} {patient.last_name}</div>
                          <div className="text-muted small">
                            {patient.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{calculateAge(patient.date_of_birth)}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.phone}</td>
                    <td>
                      <span className="badge bg-info">
                        {patient.blood_type || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleViewPatient(patient)}
                          title="View Details"
                        >
                          <i className="fas fa-eye" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeletePatient(patient)}
                          title="Delete Patient"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!patients || patients.length === 0 && (
            <div className="text-center py-4">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">No patients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Patient</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddPatient}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newPatientData.first_name}
                        onChange={(e) => setNewPatientData({ ...newPatientData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newPatientData.last_name}
                        onChange={(e) => setNewPatientData({ ...newPatientData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newPatientData.email}
                      onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPatientData.password}
                      onChange={(e) => setNewPatientData({ ...newPatientData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newPatientData.contact_number}
                        onChange={(e) => setNewPatientData({ ...newPatientData, contact_number: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newPatientData.date_of_birth}
                        onChange={(e) => setNewPatientData({ ...newPatientData, date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-select"
                        value={newPatientData.gender}
                        onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Blood Type</label>
                      <select
                        className="form-select"
                        value={newPatientData.blood_type}
                        onChange={(e) => setNewPatientData({ ...newPatientData, blood_type: e.target.value })}
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createPatientMutation.isPending}
                  >
                    {createPatientMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus me-2"></i>
                        Add Patient
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {showViewModal && selectedPatient && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Patient Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <strong>Name:</strong>
                    <p>{selectedPatient.first_name} {selectedPatient.last_name}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Age:</strong>
                    <p>{calculateAge(selectedPatient.date_of_birth)} years old</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Email:</strong>
                    <p>{selectedPatient.email}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong>
                    <p>{selectedPatient.phone}</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Gender:</strong>
                    <p>{selectedPatient.gender}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Blood Type:</strong>
                    <p>{selectedPatient.blood_type || 'Not specified'}</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Date of Birth:</strong>
                    <p>{new Date(selectedPatient.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Patient ID:</strong>
                    <p>{selectedPatient.patient_id}</p>
                  </div>
                </div>
                {selectedPatient.insurance_provider && (
                  <div className="row">
                    <div className="col-12">
                      <strong>Insurance Provider:</strong>
                      <p>{selectedPatient.insurance_provider}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && patientToDelete && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete Patient</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> This action cannot be undone.
                </div>
                <p>
                  Are you sure you want to delete patient{" "}
                  <strong>{patientToDelete.first_name} {patientToDelete.last_name}</strong>?
                </p>
                <p className="text-muted small">
                  This will permanently delete the patient and all associated records including:
                </p>
                <ul className="text-muted small">
                  <li>Medical records and appointments</li>
                  <li>Medications and allergies</li>
                  <li>Billing and payment history</li>
                  <li>AI diagnosis records</li>
                  <li>Chatbot interaction logs</li>
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletePatientMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeletePatient}
                  disabled={deletePatientMutation.isPending}
                >
                  {deletePatientMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-2"></i>
                      Delete Patient
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  );
}
