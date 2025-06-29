import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { format } from 'date-fns';
import { useState } from 'react';
import { useDoctorLabTests } from '~/api/queries/useDoctorLabTests';

export default function DrTests() {
  const { data: tests, isLoading, error } = useDoctorLabTests();
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Function to view test details
  const handleViewTest = (test: any) => {
    setSelectedTest(test);
    setShowViewModal(true);
  };

  // Function to get status based on test data
  const getTestStatus = (test: any) => {
    // All tests in medical records are completed since they have results
    return 'completed';
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
              Error loading lab tests. Please try again.
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
              <i className="fas fa-flask me-2" />
              Lab Tests & Results
            </h4>
            <div className="text-muted">
              <i className="fas fa-info-circle me-2"></i>
              {tests?.length || 0} tests found
            </div>
          </div>

          {tests && tests.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Test Name</th>
                    <th>Test Date</th>
                    <th>Appointment Date</th>
                    <th>Status</th>
                    <th>Result Summary</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test.record_id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-info bg-opacity-10 p-2 me-2">
                            <i className="fas fa-user text-info" />
                          </div>
                          <strong>{test.patient_name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-flask text-primary me-2" />
                          <span className="fw-medium">{test.test_name}</span>
                        </div>
                      </td>
                      <td>{format(new Date(test.created_at), 'MMM dd, yyyy')}</td>
                      <td>
                        {test.appointment_date ? (
                          <small className="text-muted">
                            {format(new Date(test.appointment_date), 'MMM dd, yyyy')}
                          </small>
                        ) : (
                          <small className="text-muted">No appointment</small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-success">
                          <i className="fas fa-check me-1" />
                          Completed
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '250px' }}>
                          <small>{test.result_summary}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm px-3 py-1 d-inline-flex align-items-center"
                            onClick={() => handleViewTest(test)}
                          >
                            <i className="fas fa-eye me-2" />
                            View Results
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm px-3 py-1 d-inline-flex align-items-center"
                            onClick={() => window.print()}
                          >
                            <i className="fas fa-print me-2" />
                            Print
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
                <i className="fas fa-flask fa-3x text-muted"></i>
              </div>
              <h5 className="text-muted">No Lab Tests Found</h5>
              <p className="text-muted">
                Lab tests will appear here once you create medical records with lab results for your patients.
              </p>
              <button className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
                Add Lab Results
              </button>
            </div>
          )}
        </DashboardContainer>
      </div>

      {/* View Test Results Modal */}
      {showViewModal && selectedTest && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-flask me-2"></i>
                  Lab Test Results
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
                    <p><strong>Name:</strong> {selectedTest.patient_name}</p>
                    <p><strong>Test Date:</strong> {format(new Date(selectedTest.created_at), "MMMM dd, yyyy 'at' h:mm a")}</p>
                    {selectedTest.appointment_date && (
                      <p><strong>Appointment:</strong> {format(new Date(selectedTest.appointment_date), "MMMM dd, yyyy")}</p>
                    )}
                    <p><strong>Status:</strong>
                      <span className="badge bg-success ms-2">
                        <i className="fas fa-check me-1" />
                        Completed
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6><i className="fas fa-info-circle me-2"></i>Test Details</h6>
                    <p><strong>Record ID:</strong> #{selectedTest.record_id}</p>
                    <p><strong>Test Name:</strong> {selectedTest.test_name}</p>
                    {selectedTest.diagnosis && (
                      <p><strong>Associated Diagnosis:</strong>
                        <span className="badge bg-primary ms-2">{selectedTest.diagnosis}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h6><i className="fas fa-flask me-2"></i>Complete Lab Results</h6>
                  <div className="alert alert-info" style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                    {selectedTest.lab_results}
                  </div>
                </div>

                {selectedTest.diagnosis && (
                  <div className="mt-3">
                    <h6><i className="fas fa-stethoscope me-2"></i>Related Diagnosis</h6>
                    <div className="alert alert-primary">
                      {selectedTest.diagnosis}
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
                  Print Results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
