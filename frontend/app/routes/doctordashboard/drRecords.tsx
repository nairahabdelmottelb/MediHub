import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { format } from 'date-fns';
import { useState } from 'react';
import { useDoctorPatientRecords } from '~/api/queries/useDoctorPatientRecords';

export default function DrRecords() {
  const { data: records, isLoading, error } = useDoctorPatientRecords();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Function to view record details
  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  // Function to get description based on record content
  const getRecordDescription = (record: any) => {
    if (record.lab_results && record.lab_results.trim()) {
      return record.lab_results.length > 100
        ? record.lab_results.substring(0, 100) + "..."
        : record.lab_results;
    } else if (record.prescriptions && record.prescriptions.trim()) {
      return record.prescriptions.length > 100
        ? record.prescriptions.substring(0, 100) + "..."
        : record.prescriptions;
    } else if (record.diagnosis && record.diagnosis.trim()) {
      return record.diagnosis.length > 100
        ? record.diagnosis.substring(0, 100) + "..."
        : record.diagnosis;
    }
    return "Medical record entry";
  };

  if (isLoading) {
    return (
      <div className="row">
        <div className="col-12">
          <DashboardContainer>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
              <div className="spinner-border text-primary" role="status">
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
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Error loading patient records. Please try again.
            </div>
          </DashboardContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <DashboardContainer>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-file-medical me-2" />
              Patient Records
            </h4>
            <div className="text-muted">
              <i className="fas fa-info-circle me-2"></i>
              {records?.length || 0} records found
            </div>
          </div>

          {records && records.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Record Type</th>
                    <th>Date Created</th>
                    <th>Appointment Date</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th style={{ width: '180px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.record_id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2">
                            <i className="fas fa-user text-primary" />
                          </div>
                          <strong>{record.patient_name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${record.record_type === 'Lab Results' ? 'bg-info' :
                            record.record_type === 'Prescription' ? 'bg-success' :
                              record.record_type === 'Diagnosis' ? 'bg-warning' :
                                'bg-secondary'
                          }`}>
                          {record.record_type}
                        </span>
                      </td>
                      <td>{format(new Date(record.created_at), 'MMM dd, yyyy')}</td>
                      <td>
                        {record.appointment_date ? (
                          <small className="text-muted">
                            {format(new Date(record.appointment_date), 'MMM dd, yyyy')}
                          </small>
                        ) : (
                          <small className="text-muted">No appointment</small>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${record.status === 'active'
                              ? 'bg-success'
                              : 'bg-secondary'
                            }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '300px' }}>
                          {getRecordDescription(record)}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm px-3 py-1 d-inline-flex align-items-center"
                            onClick={() => handleViewRecord(record)}
                          >
                            <i className="fas fa-eye me-2" />
                            View
                          </button>
                          <button className="btn btn-info btn-sm px-3 py-1 d-inline-flex align-items-center">
                            <i className="fas fa-edit me-2" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="fas fa-file-medical fa-3x text-muted"></i>
              </div>
              <h5 className="text-muted">No Patient Records Found</h5>
              <p className="text-muted">
                Patient records will appear here once you start creating medical records for your appointments.
              </p>
              <button className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
                Add New Record
              </button>
            </div>
          )}
        </DashboardContainer>
      </div>

      {/* View Record Details Modal */}
      {showViewModal && selectedRecord && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-medical me-2"></i>
                  Medical Record Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6><i className="fas fa-user me-2"></i>Patient Information</h6>
                    <p><strong>Name:</strong> {selectedRecord.patient_name}</p>
                    <p><strong>Record Type:</strong>
                      <span className={`badge ms-2 ${selectedRecord.record_type === 'Lab Results' ? 'bg-info' :
                          selectedRecord.record_type === 'Prescription' ? 'bg-success' :
                            selectedRecord.record_type === 'Diagnosis' ? 'bg-warning' :
                              'bg-secondary'
                        }`}>
                        {selectedRecord.record_type}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {format(new Date(selectedRecord.created_at), "MMMM dd, yyyy 'at' h:mm a")}</p>
                    {selectedRecord.appointment_date && (
                      <p><strong>Appointment:</strong> {format(new Date(selectedRecord.appointment_date), "MMMM dd, yyyy")}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6><i className="fas fa-info-circle me-2"></i>Record Details</h6>
                    <p><strong>Status:</strong>
                      <span className={`badge ms-2 ${selectedRecord.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedRecord.status}
                      </span>
                    </p>
                    <p><strong>Record ID:</strong> #{selectedRecord.record_id}</p>
                  </div>
                </div>

                {selectedRecord.diagnosis && (
                  <div className="mt-3">
                    <h6><i className="fas fa-stethoscope me-2"></i>Diagnosis</h6>
                    <div className="alert alert-primary">
                      {selectedRecord.diagnosis}
                    </div>
                  </div>
                )}

                {selectedRecord.prescriptions && (
                  <div className="mt-3">
                    <h6><i className="fas fa-prescription-bottle me-2"></i>Prescriptions</h6>
                    <div className="alert alert-success">
                      {selectedRecord.prescriptions}
                    </div>
                  </div>
                )}

                {selectedRecord.lab_results && (
                  <div className="mt-3">
                    <h6><i className="fas fa-vial me-2"></i>Lab Results</h6>
                    <div className="alert alert-info" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRecord.lab_results}
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
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print me-2"></i>
                  Print Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
