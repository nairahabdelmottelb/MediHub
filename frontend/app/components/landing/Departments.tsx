import FacilityCard from "./FacilityCard/FacilityCard";

export default function Departments() {
  return (
    <section className="py-5 bg-white">
      <div className="container">
        <h2 className="text-center text-primary mb-5">
          Our Medical Facilities
        </h2>
        <div className="row g-4">
          <div className="col-md-6 col-lg-4">
            <FacilityCard
              title="Emergency Care"
              cardImg="images/emergency.jpg"
              cardImgAlt="Emergency Department"
              iconClasses="fas fa-ambulance"
              description="24/7 emergency services with trauma care specialists"
              benefits={[
                "Rapid Response Team",
                "Advanced Life Support",
                "Pediatric Emergency Care",
              ]}
            />
          </div>

          <div className="col-md-6 col-lg-4">
            <FacilityCard
              title="Advanced Surgery"
              cardImg="images/banner.png"
              cardImgAlt="Surgical Suite"
              iconClasses="fas fa-syringe"
              description="State-of-the-art operating theaters with robotic assistance"
              benefits={[
                "Minimally Invasive Procedures",
                "Cardiac Surgery",
                "Orthopedic Operations",
              ]}
            />
          </div>

          <div className="col-md-6 col-lg-4">
            <FacilityCard
              title="Maternity Care"
              cardImg="images/maternityCare.jpg"
              cardImgAlt="Maternity Ward"
              iconClasses="fas fa-baby-carriage"
              description="Family-centered care for mothers and newborns"
              benefits={[
                "Private Birthing Suites",
                "Neonatal ICU",
                "Postpartum Support",
              ]}
            />
          </div>

          <div className="col-md-6 col-lg-4">
            <FacilityCard
              title="Diagnostic Imaging"
              cardImg="images/diagnostic.jpg"
              cardImgAlt="Imaging Center"
              iconClasses="fas fa-x-ray"
              description="Advanced diagnostic technology for accurate results"
              benefits={[
                "MRI & CT Scans",
                "Ultrasound Imaging",
                "Digital X-Ray",
              ]}
            />
          </div>

          <div className="col-md-6 col-lg-4">
            <FacilityCard
              title="24-Hour Pharmacy"
              cardImg="\images\pharmacy.jpg"
              cardImgAlt="Pharmacy"
              iconClasses="fas fa-prescription-bottle"
              description="Full-service pharmacy with medication counseling"
              benefits={[
                "Generic Medications",
                "Compounding Services",
                "Home Delivery",
              ]}
            />
          </div>

          <div className="col-md-6 col-lg-4">
            <FacilityCard
              title="Rehabilitation"
              cardImg="images\rehab.jpg"
              cardImgAlt="Rehabilitation Center"
              iconClasses="fas fa-wheelchair"
              description="Comprehensive physical therapy programs"
              benefits={[
                "Sports Injury Recovery",
                "Neurological Rehab",
                "Pain Management",
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
