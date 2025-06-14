import { DashboardContainer } from "../../components/adminDashboard/Containers";

export default function AdminDashboard() {
  return (
    <DashboardContainer>
      <div className="row g-4">
        {/* Quick Stats */}
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Doctors</h6>
                  <h3 className="mb-0">42</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-user-md text-primary fs-4" />
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
                  <h6 className="text-muted mb-2">Total Patients</h6>
                  <h3 className="mb-0">1,234</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-users text-success fs-4" />
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
                  <h6 className="text-muted mb-2">Appointments Today</h6>
                  <h3 className="mb-0">56</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-calendar-check text-info fs-4" />
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
                  <h6 className="text-muted mb-2">Revenue This Month</h6>
                  <h3 className="mb-0">$24,500</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-dollar-sign text-warning fs-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <button className="btn btn-primary w-100">
                    <i className="fas fa-plus me-2" />
                    Add New Doctor
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-success w-100">
                    <i className="fas fa-file-import me-2" />
                    Import Patient Data
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-info w-100">
                    <i className="fas fa-chart-line me-2" />
                    View Reports
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-warning w-100">
                    <i className="fas fa-cog me-2" />
                    System Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar avatar-sm">
                      <i className="fas fa-user-plus text-success" />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <p className="mb-0">
                      New doctor registered: Dr. Sarah Johnson
                    </p>
                    <small className="text-muted">2 hours ago</small>
                  </div>
                </div>
                <div className="list-group-item d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar avatar-sm">
                      <i className="fas fa-file-alt text-primary" />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <p className="mb-0">Monthly report generated</p>
                    <small className="text-muted">5 hours ago</small>
                  </div>
                </div>
                <div className="list-group-item d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar avatar-sm">
                      <i className="fas fa-bell text-warning" />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <p className="mb-0">System maintenance scheduled</p>
                    <small className="text-muted">1 day ago</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">System Status</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Server Status</span>
                  <span className="badge bg-success">Online</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Database Status</span>
                  <span className="badge bg-success">Connected</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Storage Usage</span>
                  <span className="badge bg-info">65%</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Memory Usage</span>
                  <span className="badge bg-warning">78%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
