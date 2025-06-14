import { DashboardContainer } from "../../components/adminDashboard/Containers";

export default function MedicalAnalytics() {
  return (
    <DashboardContainer>
      <div className="row g-4">
        {/* Key Metrics */}
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Patients</h6>
                  <h3 className="mb-0">1,234</h3>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1" />
                    8% increase
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-users text-primary fs-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Active Cases</h6>
                  <h3 className="mb-0">156</h3>
                  <small className="text-danger">
                    <i className="fas fa-arrow-up me-1" />
                    5% increase
                  </small>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <i className="fas fa-file-medical text-danger fs-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Average Recovery Time</h6>
                  <h3 className="mb-0">14 days</h3>
                  <small className="text-success">
                    <i className="fas fa-arrow-down me-1" />2 days decrease
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-clock text-success fs-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Success Rate</h6>
                  <h3 className="mb-0">94%</h3>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1" />
                    2% increase
                  </small>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-chart-pie text-info fs-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Patient Demographics</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="mb-3">Age Distribution</h6>
                  <div className="list-group list-group-flush">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>0-18 years</span>
                      <span className="badge bg-primary">15%</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>19-35 years</span>
                      <span className="badge bg-primary">25%</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>36-50 years</span>
                      <span className="badge bg-primary">30%</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>51+ years</span>
                      <span className="badge bg-primary">30%</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="mb-3">Gender Distribution</h6>
                  <div className="list-group list-group-flush">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>Male</span>
                      <span className="badge bg-primary">45%</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>Female</span>
                      <span className="badge bg-primary">55%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Conditions */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Common Conditions</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Hypertension</h6>
                    <small className="text-muted">Most common condition</small>
                  </div>
                  <span className="badge bg-primary">25%</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Diabetes</h6>
                    <small className="text-muted">Second most common</small>
                  </div>
                  <span className="badge bg-primary">20%</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Respiratory Issues</h6>
                    <small className="text-muted">Third most common</small>
                  </div>
                  <span className="badge bg-primary">15%</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Other Conditions</h6>
                    <small className="text-muted">
                      Miscellaneous conditions
                    </small>
                  </div>
                  <span className="badge bg-primary">40%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment Effectiveness */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Treatment Effectiveness</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-pills text-primary" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Medication Success</h6>
                      <small className="text-muted">92% effective</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-procedures text-success" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Surgical Success</h6>
                      <small className="text-muted">96% effective</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-heartbeat text-info" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Therapy Success</h6>
                      <small className="text-muted">88% effective</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-stethoscope text-warning" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Overall Success</h6>
                      <small className="text-muted">94% effective</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
