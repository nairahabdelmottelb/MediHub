import "./FacilityCard.css";

interface FacilityCardProps {
  title: string;
  cardImg: string;
  cardImgAlt: string;
  iconClasses: string;
  description: string;
  benefits: string[];
}

export default function FacilityCard(props: FacilityCardProps) {
  return (
    <div className="card facility-card h-100">
      <img
        src={props.cardImg}
        className="card-img-top"
        alt={props.cardImgAlt}
      />
      <div className="card-body">
        <h5 className="card-title text-primary">
          <i className="fas fa-ambulance me-2" />
          {props.title}
        </h5>
        <p className="card-text text-secondary">{props.description}</p>
        <ul className="facility-features">
          {props.benefits.map((point, i) => (
            <li key={i}>
              <i className="fas fa-check-circle text-success me-2" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
