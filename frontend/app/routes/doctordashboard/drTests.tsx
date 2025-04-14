import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { format } from 'date-fns';

interface PatientTest {
  id: number;
  patientName: string;
  testName: string;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
  result?: string;
}

export default function DrTests() {
  // Sample data
  const tests: PatientTest[] = [
    {
      id: 1,
      patientName: 'John Doe',
      testName: 'Blood Test',
      date: new Date(2024, 3, 1),
      status: 'completed',
      result: 'Normal',
    },
    {
      id: 2,
      patientName: 'Jane Smith',
      testName: 'X-Ray',
      date: new Date(2024, 3, 2),
      status: 'pending',
    },
  ];

  return (
    <div className="row">
      <div className="col-12">
        <DashboardContainer>
          <h4>
            <i className="fas fa-flask me-2" />
            Patient Tests
          </h4>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Test Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.patientName}</td>
                    <td>{test.testName}</td>
                    <td>{format(test.date, 'MMM dd, yyyy')}</td>
                    <td>
                      <span
                        className={`badge ${
                          test.status === 'completed'
                            ? 'bg-success'
                            : test.status === 'pending'
                            ? 'bg-warning'
                            : 'bg-danger'
                        }`}
                      >
                        {test.status}
                      </span>
                    </td>
                    <td>{test.result || '-'}</td>
                    <td>
                      <button className="btn btn-primary btn-sm me-2">
                        <i className="fas fa-eye me-1" />
                        View
                      </button>
                      {test.status === 'pending' && (
                        <button className="btn btn-success btn-sm">
                          <i className="fas fa-check me-1" />
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardContainer>
      </div>
    </div>
  );
}
