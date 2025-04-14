import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { format } from 'date-fns';

interface PatientRecord {
  id: number;
  patientName: string;
  recordType: string;
  date: Date;
  status: 'active' | 'archived';
  description: string;
}

export default function DrRecords() {
  // Sample data
  const records: PatientRecord[] = [
    {
      id: 1,
      patientName: 'John Doe',
      recordType: 'Medical History',
      date: new Date(2024, 3, 1),
      status: 'active',
      description: 'Complete medical history including allergies and previous conditions',
    },
    {
      id: 2,
      patientName: 'Jane Smith',
      recordType: 'Treatment Plan',
      date: new Date(2024, 3, 2),
      status: 'active',
      description: 'Current treatment plan for ongoing condition',
    },
  ];

  return (
    <div className="row">
      <div className="col-12">
        <DashboardContainer>
          <h4>
            <i className="fas fa-file-medical me-2" />
            Patient Records
          </h4>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Record Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th style={{ width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.patientName}</td>
                    <td>{record.recordType}</td>
                    <td>{format(record.date, 'MMM dd, yyyy')}</td>
                    <td>
                      <span
                        className={`badge ${
                          record.status === 'active'
                            ? 'bg-success'
                            : 'bg-secondary'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td>{record.description}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary px-3 py-1 d-inline-flex align-items-center">
                          <i className="fas fa-eye me-2" />
                          View
                        </button>
                        <button className="btn btn-info px-3 py-1 d-inline-flex align-items-center">
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
        </DashboardContainer>
      </div>
    </div>
  );
}
