import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { format } from "date-fns";
import { useDoctorPatientMedications } from "../../api/queries/useMedications";
import { useCurrentDoctor } from "../../api/queries/useCurrentDoctor";
import { usePatientMedicalRecords } from "../../api/queries/useMedicalRecords";
import { useUpdateMedication } from "../../api/mutations/useMedicationMutations";
import { useState } from "react";

export default function DrMedications() {
  const { data: currentDoctor, isLoading: doctorLoading } = useCurrentDoctor();
  const { data: medicationsData, isLoading: medicationsLoading, error } = useDoctorPatientMedications(currentDoctor?.doctor_id);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("all");

  // Modal states
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [showMedicalHistoryModal, setShowMedicalHistoryModal] = useState(false);
  const [showEditMedicationModal, setShowEditMedicationModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);

  // Editing states
  const [editForm, setEditForm] = useState({
    medication_name: "",
    dosage: ""
  });

  // Hooks for medical records and mutations
  const { data: medicalRecords, isLoading: medicalRecordsLoading } = usePatientMedicalRecords(selectedPatientId || 0);
  const updateMedicationMutation = useUpdateMedication();

  // Handler functions
  const handleViewPatientDetails = (medication: any) => {
    setSelectedPatientId(medication.patient_id);
    setSelectedMedication(medication);
    setShowPatientDetailsModal(true);
  };

  const handleViewMedicalHistory = (medication: any) => {
    setSelectedPatientId(medication.patient_id);
    setSelectedMedication(medication);
    setShowMedicalHistoryModal(true);
  };

  const handleEditMedication = (medication: any) => {
    setSelectedMedication(medication);
    setEditForm({
      medication_name: medication.medication_name,
      dosage: medication.dosage
    });
    setShowEditMedicationModal(true);
  };

  const handleSaveEditMedication = async () => {
    if (!selectedMedication) return;

    try {
      await updateMedicationMutation.mutateAsync({
        patientId: selectedMedication.patient_id,
        medicationId: selectedMedication.medication_id,
        data: editForm
      });
      setShowEditMedicationModal(false);
      setSelectedMedication(null);
    } catch (error) {
      console.error("Error updating medication:", error);
    }
  };

  if (doctorLoading || medicationsLoading) {
    return (
      <div className="row">
        <div className="col-12">
          <DashboardContainer>
            <div className="d-flex justify-content-center p-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </DashboardContainer>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="row">
        <div className="col-12">
          <DashboardContainer>
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Error loading medications: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </DashboardContainer>
        </div>
      </div>
    );
  }

  const medications = medicationsData?.medications || [];

  // Get unique patients for filter dropdown
  const uniquePatients = medications.reduce((acc, med) => {
    const patientKey = `${med.patient_first_name} ${med.patient_last_name}`;
    if (!acc.some(p => p.key === patientKey)) {
      acc.push({
        key: patientKey,
        id: med.patient_id,
        name: patientKey
      });
    }
    return acc;
  }, [] as { key: string; id: number; name: string }[]);

  // Filter medications based on search term and selected patient
  const filteredMedications = medications.filter(med => {
    const patientName = `${med.patient_first_name} ${med.patient_last_name}`;
    const matchesSearch = searchTerm === "" ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPatient = selectedPatient === "all" || patientName === selectedPatient;

    return matchesSearch && matchesPatient;
  });

  return (
    <div className="row">
      <div className="col-12">
        <DashboardContainer>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>
              <i className="fas fa-pills me-2 text-primary" />
              Patient Medications
            </h4>
            <div className="d-flex align-items-center">
              <span className="badge bg-info me-2">
                Total: {filteredMedications.length}
              </span>
              {medicationsData?.doctor && (
                <span className="text-muted">
                  Dr. {medicationsData.doctor.first_name} {medicationsData.doctor.last_name}
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by patient name, medication, or dosage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="all">All Patients ({uniquePatients.length})</option>
                {uniquePatients.map((patient) => (
                  <option key={patient.id} value={patient.name}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          {filteredMedications.length !== medications.length && (
            <div className="alert alert-info py-2">
              Showing {filteredMedications.length} of {medications.length} medications
            </div>
          )}

          {filteredMedications.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-pills fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No medications found</h5>
              <p className="text-muted">
                {medications.length === 0
                  ? "No patients with medications have appointments with you yet."
                  : "Try adjusting your search criteria."
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>Patient</th>
                    <th>Patient Info</th>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Last Appointment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedications.map((medication) => (
                    <tr key={`${medication.patient_id}-${medication.medication_id}`}>
                      <td>
                        <div className="d-flex flex-column">
                          <strong className="text-dark">
                            {medication.patient_first_name} {medication.patient_last_name}
                          </strong>
                          <small className="text-muted">
                            <i className="fas fa-envelope me-1"></i>
                            {medication.patient_email}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div>
                            <i className="fas fa-birthday-cake me-1 text-muted"></i>
                            {format(new Date(medication.date_of_birth), "MMM dd, yyyy")}
                          </div>
                          <div>
                            <i className="fas fa-venus-mars me-1 text-muted"></i>
                            {medication.gender}
                          </div>
                          {medication.blood_type && (
                            <div>
                              <i className="fas fa-tint me-1 text-danger"></i>
                              {medication.blood_type}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold text-primary">
                          {medication.medication_name}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {medication.dosage}
                        </span>
                      </td>
                      <td>
                        <div className="small">
                          <div>
                            {format(new Date(medication.last_appointment), "MMM dd, yyyy")}
                          </div>
                          <div className="text-muted">
                            {format(new Date(medication.last_appointment), "h:mm a")}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${medication.appointment_status === "Completed"
                            ? "bg-success"
                            : medication.appointment_status === "Scheduled"
                              ? "bg-primary"
                              : "bg-secondary"
                            }`}
                        >
                          {medication.appointment_status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            title="View Patient Details"
                            onClick={() => handleViewPatientDetails(medication)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-info"
                            title="View Medical History"
                            onClick={() => handleViewMedicalHistory(medication)}
                          >
                            <i className="fas fa-file-medical"></i>
                          </button>
                          <button
                            className="btn btn-outline-success"
                            title="Edit Medication"
                            onClick={() => handleEditMedication(medication)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardContainer>

        {/* Patient Details Modal */}
        {showPatientDetailsModal && selectedMedication && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-user-circle me-2"></i>
                    Patient Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPatientDetailsModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary">Personal Information</h6>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td><strong>Name:</strong></td>
                            <td>{selectedMedication.patient_first_name} {selectedMedication.patient_last_name}</td>
                          </tr>
                          <tr>
                            <td><strong>Email:</strong></td>
                            <td>{selectedMedication.patient_email}</td>
                          </tr>
                          <tr>
                            <td><strong>Date of Birth:</strong></td>
                            <td>{format(new Date(selectedMedication.date_of_birth), "MMMM dd, yyyy")}</td>
                          </tr>
                          <tr>
                            <td><strong>Gender:</strong></td>
                            <td>{selectedMedication.gender}</td>
                          </tr>
                          <tr>
                            <td><strong>Blood Type:</strong></td>
                            <td>
                              {selectedMedication.blood_type ? (
                                <span className="badge bg-danger">{selectedMedication.blood_type}</span>
                              ) : (
                                <span className="text-muted">Not specified</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary">Appointment Information</h6>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td><strong>Last Appointment:</strong></td>
                            <td>{format(new Date(selectedMedication.last_appointment), "MMMM dd, yyyy 'at' h:mm a")}</td>
                          </tr>
                          <tr>
                            <td><strong>Status:</strong></td>
                            <td>
                              <span className={`badge ${selectedMedication.appointment_status === "Completed" ? "bg-success" :
                                  selectedMedication.appointment_status === "Scheduled" ? "bg-primary" : "bg-secondary"
                                }`}>
                                {selectedMedication.appointment_status}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Age:</strong></td>
                            <td>
                              {Math.floor((new Date().getTime() - new Date(selectedMedication.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPatientDetailsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical History Modal */}
        {showMedicalHistoryModal && selectedMedication && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-file-medical me-2"></i>
                    Medical History - {selectedMedication.patient_first_name} {selectedMedication.patient_last_name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowMedicalHistoryModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {medicalRecordsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading medical history...</span>
                      </div>
                    </div>
                  ) : medicalRecords && medicalRecords.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Diagnosis</th>
                            <th>Prescriptions</th>
                            <th>Lab Results</th>
                            <th>Doctor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicalRecords.map((record) => (
                            <tr key={record.record_id}>
                              <td>
                                <small>{format(new Date(record.created_at), "MMM dd, yyyy")}</small>
                              </td>
                              <td>
                                <div className="fw-bold text-primary">{record.diagnosis}</div>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {record.prescriptions || "No prescriptions"}
                                </small>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {record.lab_results || "No lab results"}
                                </small>
                              </td>
                              <td>
                                <small>
                                  {record.doctor ?
                                    `Dr. ${record.doctor.first_name} ${record.doctor.last_name}` :
                                    "Unknown"
                                  }
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fas fa-file-medical fa-3x text-muted mb-3"></i>
                      <h6 className="text-muted">No Medical History Found</h6>
                      <p className="text-muted">This patient doesn't have any medical records yet.</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowMedicalHistoryModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Medication Modal */}
        {showEditMedicationModal && selectedMedication && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-edit me-2"></i>
                    Edit Medication
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditMedicationModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <div className="alert alert-info">
                      <strong>Patient:</strong> {selectedMedication.patient_first_name} {selectedMedication.patient_last_name}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="medication_name" className="form-label">
                      <i className="fas fa-pills me-1"></i>
                      Medication Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="medication_name"
                      value={editForm.medication_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, medication_name: e.target.value }))}
                      placeholder="Enter medication name"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="dosage" className="form-label">
                      <i className="fas fa-weight me-1"></i>
                      Dosage
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="dosage"
                      value={editForm.dosage}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="Enter dosage (e.g., 10mg once daily)"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditMedicationModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSaveEditMedication}
                    disabled={updateMedicationMutation.isPending}
                  >
                    {updateMedicationMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-1"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
