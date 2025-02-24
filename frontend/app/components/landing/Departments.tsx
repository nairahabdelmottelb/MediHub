export default function Departments() {
  return (
    <section className="py-5 bg-white">
      <div className="container">
        <h2 className="text-center text-primary mb-5">
          Our Medical Facilities
        </h2>
        <div className="row g-4">
          <div className="col-md-6 col-lg-4">
            <div className="card facility-card h-100">
              <img
                src="images/emergency.jpg"
                className="card-img-top"
                alt="Emergency Department"
              />
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fas fa-ambulance me-2"></i>Emergency Care
                </h5>
                <p className="card-text text-secondary">
                  24/7 emergency services with trauma care specialists
                </p>
                <ul className="facility-features">
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Rapid Response Team
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Advanced Life Support
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Pediatric Emergency Care
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-4">
            <div className="card facility-card h-100">
              <img
                src="images/banner.png"
                className="card-img-top"
                alt="Surgical Suite"
              />
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fas fa-syringe me-2"></i>Advanced Surgery
                </h5>
                <p className="card-text text-secondary">
                  State-of-the-art operating theaters with robotic assistance
                </p>
                <ul className="facility-features">
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Minimally Invasive Procedures
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Cardiac Surgery
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Orthopedic Operations
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-4">
            <div className="card facility-card h-100">
              <img
                src="images/maternity.jpg"
                className="card-img-top"
                alt="Maternity Ward"
              />
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fas fa-baby-carriage me-2"></i>Maternity Care
                </h5>
                <p className="card-text text-secondary">
                  Family-centered care for mothers and newborns
                </p>
                <ul className="facility-features">
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Private Birthing Suites
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Neonatal ICU
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Postpartum Support
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-4">
            <div className="card facility-card h-100">
              <img
                src="images/imaging.jpg"
                className="card-img-top"
                alt="Imaging Center"
              />
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fas fa-x-ray me-2"></i>Diagnostic Imaging
                </h5>
                <p className="card-text text-secondary">
                  Advanced diagnostic technology for accurate results
                </p>
                <ul className="facility-features">
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>MRI
                    & CT Scans
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Ultrasound Imaging
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Digital X-Ray
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-4">
            <div className="card facility-card h-100">
              <img
                src="images/pharmacy.jpg"
                className="card-img-top"
                alt="Pharmacy"
              />
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fas fa-prescription-bottle me-2"></i>24-Hour
                  Pharmacy
                </h5>
                <p className="card-text text-secondary">
                  Full-service pharmacy with medication counseling
                </p>
                <ul className="facility-features">
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Generic Medications
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Compounding Services
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Home Delivery
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-4">
            <div className="card facility-card h-100">
              <img
                src="images/rehab.jpg"
                className="card-img-top"
                alt="Rehabilitation Center"
              />
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fas fa-wheelchair me-2"></i>Rehabilitation
                </h5>
                <p className="card-text text-secondary">
                  Comprehensive physical therapy programs
                </p>
                <ul className="facility-features">
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Sports Injury Recovery
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Neurological Rehab
                  </li>
                  <li>
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Pain Management
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
