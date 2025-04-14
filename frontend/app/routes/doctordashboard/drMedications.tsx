import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { format } from 'date-fns';

interface PatientMedication {
  id: number;
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export default function DrMedications() {
  // Sample data
  const medications: PatientMedication[] = [
    {
      id: 1,
      patientName: 'John Doe',
      medicationName: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: new Date(2024, 3, 1),
      endDate: new Date(2024, 3, 7),
      status: 'active',
    },
    {
      id: 2,
      patientName: 'Jane Smith',
      medicationName: 'Ibuprofen',
      dosage: '200mg',
      frequency: 'As needed',
      startDate: new Date(2024, 3, 2),
      status: 'active',
    },
  ];

  return (
    <div className="row">
      <div className="col-12">
        <DashboardContainer>
          <h4>
            <i className="fas fa-pills me-2" />
            Patient Medications
          </h4>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((medication) => (
                  <tr key={medication.id}>
                    <td>{medication.patientName}</td>
                    <td>{medication.medicationName}</td>
                    <td>{medication.dosage}</td>
                    <td>{medication.frequency}</td>
                    <td>{format(medication.startDate, 'MMM dd, yyyy')}</td>
                    <td>
                      {medication.endDate
                        ? format(medication.endDate, 'MMM dd, yyyy')
                        : '-'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          medication.status === 'active'
                            ? 'bg-success'
                            : medication.status === 'completed'
                            ? 'bg-info'
                            : 'bg-danger'
                        }`}
                      >
                        {medication.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm me-2">
                        <i className="fas fa-eye me-1" />
                        View
                      </button>
                      <button className="btn btn-info btn-sm">
                        <i className="fas fa-edit me-1" />
                        Edit
                      </button>
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
