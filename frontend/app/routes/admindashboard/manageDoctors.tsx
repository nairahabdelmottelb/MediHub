import { useState, useEffect } from "react";
import { DashboardContainer } from "../../components/adminDashboard/Containers";
import { useDoctors, useCreateDoctor, useDeleteDoctor, useDepartments, useSpecializations, useUpdateDoctor } from "../../api/queries/useDoctorManagement";
import type { DoctorCreateRequest, Doctor } from "../../api/queries/useDoctorManagement";

interface AddDoctorModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: DoctorCreateRequest) => void;
  isLoading: boolean;
}

function AddDoctorModal({ show, onHide, onSubmit, isLoading }: AddDoctorModalProps) {
  const { data: departments = [] } = useDepartments();
  const { data: specializations = [] } = useSpecializations();

  const [formData, setFormData] = useState<DoctorCreateRequest>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    specialty: "",
    department_id: undefined,
    qualifications: "",
    years_of_experience: 0,
  });

  // Reset form when modal is closed
  const handleHide = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_number: "",
      address: "",
      specialty: "",
      department_id: undefined,
      qualifications: "",
      years_of_experience: 0,
    });
    onHide();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_of_experience' ? parseInt(value) || 0 :
        name === 'department_id' ? (value ? parseInt(value) : undefined) :
          value
    }));
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Doctor</h5>
            <button type="button" className="btn-close" onClick={handleHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">First Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Last Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email*</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Password*</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Years of Experience*</label>
                    <input
                      type="number"
                      className="form-control"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Specialty*</label>
                    <select
                      className="form-select"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Specialty</option>
                      {specializations.map(spec => (
                        <option key={spec.spec_id} value={spec.spec_name}>
                          {spec.spec_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Department*</label>
                    <select
                      className="form-select"
                      name="department_id"
                      value={formData.department_id || ""}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Qualifications*</label>
                <textarea
                  className="form-control"
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  placeholder="e.g. MD, MBBS, Fellowship in Cardiology"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </span>
                    Adding...
                  </>
                ) : (
                  "Add Doctor"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// View Doctor Modal Component
interface ViewDoctorModalProps {
  show: boolean;
  onHide: () => void;
  doctor: Doctor | null;
}

function ViewDoctorModal({ show, onHide, doctor }: ViewDoctorModalProps) {
  if (!show || !doctor) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Doctor Details</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Full Name</label>
                  <p className="form-control-plaintext">Dr. {doctor.first_name} {doctor.last_name}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <p className="form-control-plaintext">{doctor.email}</p>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Phone Number</label>
                  <p className="form-control-plaintext">{doctor.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Years of Experience</label>
                  <p className="form-control-plaintext">{doctor.years_of_exp} years</p>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Specialty</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-info fs-6">{doctor.spec_name}</span>
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Department</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-secondary fs-6">{doctor.department_name}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label fw-bold">Doctor ID</label>
                  <p className="form-control-plaintext">#{doctor.doctor_id}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Doctor Modal Component
interface EditDoctorModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: Partial<DoctorCreateRequest>) => void;
  isLoading: boolean;
  doctor: Doctor | null;
}

function EditDoctorModal({ show, onHide, onSubmit, isLoading, doctor }: EditDoctorModalProps) {
  const { data: departments = [] } = useDepartments();
  const { data: specializations = [] } = useSpecializations();

  const [formData, setFormData] = useState<Partial<DoctorCreateRequest>>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    specialty: "",
    department_id: undefined,
    years_of_experience: 0,
  });

  // Initialize form data when doctor changes
  useEffect(() => {
    if (doctor) {
      setFormData({
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        email: doctor.email,
        phone_number: doctor.phone || "",
        specialty: doctor.spec_name,
        department_id: doctor.department_id,
        years_of_experience: doctor.years_of_exp,
      });
    }
  }, [doctor]);

  const handleHide = () => {
    onHide();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'years_of_experience' ? parseInt(value) || 0 :
        name === 'department_id' ? (value ? parseInt(value) : undefined) :
          value
    }));
  };

  if (!show || !doctor) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Doctor - Dr. {doctor.first_name} {doctor.last_name}</h5>
            <button type="button" className="btn-close" onClick={handleHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">First Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Last Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email*</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Years of Experience*</label>
                    <input
                      type="number"
                      className="form-control"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Specialty*</label>
                    <select
                      className="form-select"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Specialty</option>
                      {specializations.map(spec => (
                        <option key={spec.spec_id} value={spec.spec_name}>
                          {spec.spec_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Department*</label>
                    <select
                      className="form-select"
                      name="department_id"
                      value={formData.department_id || ""}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </span>
                    Updating...
                  </>
                ) : (
                  "Update Doctor"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ManageDoctors() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const { data: doctors = [], isLoading, error } = useDoctors();
  const createDoctorMutation = useCreateDoctor();
  const updateDoctorMutation = useUpdateDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  const handleAddDoctor = async (data: DoctorCreateRequest) => {
    try {
      await createDoctorMutation.mutateAsync(data);
      setShowAddModal(false);
      setNotification({
        type: 'success',
        message: `Dr. ${data.first_name} ${data.last_name} has been added successfully!`
      });
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      console.error('Failed to add doctor:', error);
      setNotification({
        type: 'error',
        message: error?.response?.data?.detail || 'Failed to add doctor. Please try again.'
      });
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  };

  const handleUpdateDoctor = async (data: Partial<DoctorCreateRequest>) => {
    if (!selectedDoctor) return;

    try {
      await updateDoctorMutation.mutateAsync({
        id: selectedDoctor.doctor_id,
        data
      });
      setShowEditModal(false);
      setSelectedDoctor(null);
      setNotification({
        type: 'success',
        message: `Dr. ${data.first_name} ${data.last_name} has been updated successfully!`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      console.error('Failed to update doctor:', error);
      setNotification({
        type: 'error',
        message: error?.response?.data?.detail || 'Failed to update doctor. Please try again.'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleDeleteDoctor = async (doctorId: number) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await deleteDoctorMutation.mutateAsync(doctorId);
        setNotification({
          type: 'success',
          message: 'Doctor has been deleted successfully!'
        });
        setTimeout(() => setNotification(null), 5000);
      } catch (error: any) {
        console.error('Failed to delete doctor:', error);
        setNotification({
          type: 'error',
          message: error?.response?.data?.detail || 'Failed to delete doctor. Please try again.'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    }
  };

  const formatName = (firstName: string, lastName: string) => {
    return `Dr. ${firstName} ${lastName}`;
  };

  if (isLoading) {
    return (
      <DashboardContainer>
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading doctors...</p>
        </div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Doctors</h4>
          <p>There was an error loading the doctors list. Please try again later.</p>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Doctors</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add New Doctor
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">All Doctors</h5>
        </div>
        <div className="card-body">
          {doctors.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No doctors found</h5>
              <p className="text-muted">Add your first doctor to get started.</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Add First Doctor
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Specialty</th>
                    <th>Department</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.doctor_id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3">
                            <i className="fas fa-user-md text-primary"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">{formatName(doctor.first_name, doctor.last_name)}</h6>
                          </div>
                        </div>
                      </td>
                      <td>{doctor.email}</td>
                      <td>{doctor.phone || 'N/A'}</td>
                      <td>
                        <span className="badge bg-info">
                          {doctor.spec_name}
                        </span>
                      </td>
                      <td>{doctor.department_name}</td>
                      <td>{doctor.years_of_exp} years</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            title="View Details"
                            onClick={() => handleViewDoctor(doctor)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit Doctor"
                            onClick={() => handleEditDoctor(doctor)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete Doctor"
                            onClick={() => handleDeleteDoctor(doctor.doctor_id)}
                            disabled={deleteDoctorMutation.isPending}
                          >
                            {deleteDoctorMutation.isPending ? (
                              <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            ) : (
                              <i className="fas fa-trash"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddDoctorModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddDoctor}
        isLoading={createDoctorMutation.isPending}
      />
      <ViewDoctorModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        doctor={selectedDoctor}
      />
      <EditDoctorModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleUpdateDoctor}
        isLoading={updateDoctorMutation.isPending}
        doctor={selectedDoctor}
      />
    </DashboardContainer>
  );
}
