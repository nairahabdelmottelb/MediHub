import { DashboardContainer } from "../../components/adminDashboard/Containers";
import { useDashboardStats, useRecentActivity, useSystemStatus } from "../../api/queries/useDashboardData";
import { useNavigate } from "react-router";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity();
  const { data: systemStatus, isLoading: statusLoading } = useSystemStatus();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };
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
                  <h3 className="mb-0">
                    {statsLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      stats?.totalDoctors || 0
                    )}
                  </h3>
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
                  <h3 className="mb-0">
                    {statsLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      stats?.totalPatients || 0
                    )}
                  </h3>
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
                  <h3 className="mb-0">
                    {statsLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      stats?.appointmentsToday || 0
                    )}
                  </h3>
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
                  <h3 className="mb-0">
                    {statsLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      `$${stats?.revenueThisMonth?.toLocaleString() || 0}`
                    )}
                  </h3>
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
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => navigate('/admin/managedoc')}
                  >
                    <i className="fas fa-plus me-2" />
                    Add New Doctor
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => navigate('/admin/managepatient')}
                  >
                    <i className="fas fa-file-import me-2" />
                    Manage Patients
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-info w-100"
                    onClick={() => navigate('/admin/businessanalytics')}
                  >
                    <i className="fas fa-chart-line me-2" />
                    View Reports
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-warning w-100"
                    onClick={() => {
                      // Could implement a settings modal or navigate to settings page
                      alert('System settings functionality coming soon!');
                    }}
                  >
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
              {activitiesLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {activities?.map((activity) => (
                    <div key={activity.id} className="list-group-item d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar avatar-sm">
                          <i className={`${activity.icon} ${activity.iconColor}`} />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="mb-0">{activity.message}</p>
                        <small className="text-muted">{formatTimeAgo(activity.timestamp)}</small>
                      </div>
                    </div>
                  ))}
                  {(!activities || activities.length === 0) && (
                    <div className="text-center py-4 text-muted">
                      No recent activity
                    </div>
                  )}
                </div>
              )}
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
              {statusLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Server Status</span>
                    <span className={`badge ${systemStatus?.serverStatus === 'online' ? 'bg-success' : 'bg-danger'}`}>
                      {systemStatus?.serverStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Database Status</span>
                    <span className={`badge ${systemStatus?.databaseStatus === 'connected' ? 'bg-success' : 'bg-danger'}`}>
                      {systemStatus?.databaseStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Storage Usage</span>
                    <span className={`badge ${(systemStatus?.storageUsage || 0) > 80 ? 'bg-danger' : (systemStatus?.storageUsage || 0) > 60 ? 'bg-warning' : 'bg-info'}`}>
                      {systemStatus?.storageUsage || 0}%
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Memory Usage</span>
                    <span className={`badge ${(systemStatus?.memoryUsage || 0) > 80 ? 'bg-danger' : (systemStatus?.memoryUsage || 0) > 60 ? 'bg-warning' : 'bg-info'}`}>
                      {systemStatus?.memoryUsage || 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
