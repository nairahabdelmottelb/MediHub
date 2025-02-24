interface FacilitiesCardProps {
  title: string;
  iconClasses: string;
  descriptionPoints: string[];
}

export default function FacilitiesCard(props: FacilitiesCardProps) {
  return (
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
  );
}
