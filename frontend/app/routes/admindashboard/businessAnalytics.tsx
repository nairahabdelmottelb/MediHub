import { DashboardContainer } from "../../components/adminDashboard/Containers";

export default function BusinessAnalytics() {
  return (
    <DashboardContainer>
      <div className="row g-4">
        {/* Financial Overview */}
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Revenue</h6>
                  <h3 className="mb-0">$245,678</h3>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1" />
                    12% increase
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-dollar-sign text-primary fs-4" />
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
                  <h6 className="text-muted mb-2">Total Expenses</h6>
                  <h3 className="mb-0">$98,456</h3>
                  <small className="text-danger">
                    <i className="fas fa-arrow-up me-1" />
                    5% increase
                  </small>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <i className="fas fa-receipt text-danger fs-4" />
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
                  <h6 className="text-muted mb-2">Net Profit</h6>
                  <h3 className="mb-0">$147,222</h3>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1" />
                    8% increase
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-chart-line text-success fs-4" />
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
                  <h6 className="text-muted mb-2">Average Revenue/Patient</h6>
                  <h3 className="mb-0">$199</h3>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1" />
                    3% increase
                  </small>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-users text-info fs-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Revenue Overview</h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: "300px" }}>
                {/* Placeholder for chart */}
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center">
                    <i className="fas fa-chart-bar fa-3x text-muted mb-3" />
                    <p className="text-muted">
                      Revenue chart will be displayed here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Services */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Top Services</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">General Consultation</h6>
                    <small className="text-muted">Most popular service</small>
                  </div>
                  <span className="badge bg-primary">45%</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Specialist Consultation</h6>
                    <small className="text-muted">Second most popular</small>
                  </div>
                  <span className="badge bg-primary">30%</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Diagnostic Tests</h6>
                    <small className="text-muted">Third most popular</small>
                  </div>
                  <span className="badge bg-primary">15%</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Other Services</h6>
                    <small className="text-muted">Miscellaneous services</small>
                  </div>
                  <span className="badge bg-primary">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Expenses Breakdown</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-user-md text-primary" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Staff Salaries</h6>
                      <small className="text-muted">$45,000</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-pills text-success" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Medical Supplies</h6>
                      <small className="text-muted">$15,000</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-building text-info" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Facility Costs</h6>
                      <small className="text-muted">$25,000</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-shrink-0">
                      <div className="avatar avatar-sm">
                        <i className="fas fa-cog text-warning" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-0">Other Expenses</h6>
                      <small className="text-muted">$13,456</small>
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
