import React, { useState } from "react";
import { DashboardContainer } from "~/components/doctorDashboard/Containers";

export default function CreatePrescription() {
  const [prescription, setPrescription] = useState({
    patientName: "",
    patientId: "",
    diagnosis: "",
    medications: [
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ],
    notes: "",
  });

  const addMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ],
    });
  };

  const removeMedication = (index: number) => {
    const updatedMedications = prescription.medications.filter(
      (_, i) => i !== index
    );
    setPrescription({
      ...prescription,
      medications: updatedMedications,
    });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updatedMedications = prescription.medications.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    );
    setPrescription({
      ...prescription,
      medications: updatedMedications,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement prescription creation logic
    console.log("Creating prescription:", prescription);
  };

  return (
    <DashboardContainer>
      <h2 className="mb-4">
        <i className="fas fa-notes-medical me-2"></i>
        Create Prescription
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6">
            <label htmlFor="patientName" className="form-label">
              Patient Name
            </label>
            <input
              type="text"
              className="form-control"
              id="patientName"
              value={prescription.patientName}
              onChange={(e) =>
                setPrescription({
                  ...prescription,
                  patientName: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="patientId" className="form-label">
              Patient ID
            </label>
            <input
              type="text"
              className="form-control"
              id="patientId"
              value={prescription.patientId}
              onChange={(e) =>
                setPrescription({ ...prescription, patientId: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="diagnosis" className="form-label">
            Diagnosis
          </label>
          <textarea
            className="form-control"
            id="diagnosis"
            rows={3}
            value={prescription.diagnosis}
            onChange={(e) =>
              setPrescription({ ...prescription, diagnosis: e.target.value })
            }
            required
          ></textarea>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Medications</h5>
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={addMedication}
            >
              <i className="fas fa-plus me-2"></i>
              Add Medication
            </button>
          </div>

          {prescription.medications.map((medication, index) => (
            <div key={index} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Medication {index + 1}</h6>
                  {prescription.medications.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeMedication(index)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Medication Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={medication.name}
                      onChange={(e) =>
                        updateMedication(index, "name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Dosage</label>
                    <input
                      type="text"
                      className="form-control"
                      value={medication.dosage}
                      onChange={(e) =>
                        updateMedication(index, "dosage", e.target.value)
                      }
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Frequency</label>
                    <input
                      type="text"
                      className="form-control"
                      value={medication.frequency}
                      onChange={(e) =>
                        updateMedication(index, "frequency", e.target.value)
                      }
                      placeholder="e.g., Twice daily"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-control"
                      value={medication.duration}
                      onChange={(e) =>
                        updateMedication(index, "duration", e.target.value)
                      }
                      placeholder="e.g., 7 days"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Special Instructions</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={medication.instructions}
                      onChange={(e) =>
                        updateMedication(index, "instructions", e.target.value)
                      }
                      placeholder="Take with food, avoid alcohol, etc."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="notes" className="form-label">
            Additional Notes
          </label>
          <textarea
            className="form-control"
            id="notes"
            rows={3}
            value={prescription.notes}
            onChange={(e) =>
              setPrescription({ ...prescription, notes: e.target.value })
            }
            placeholder="Additional instructions or notes..."
          ></textarea>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-save me-2"></i>
            Create Prescription
          </button>
          <button type="button" className="btn btn-secondary">
            <i className="fas fa-times me-2"></i>
            Cancel
          </button>
        </div>
      </form>
    </DashboardContainer>
  );
}
