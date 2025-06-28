import { Link } from "react-router";

interface BookApptProps {
  text?: string;
  className?: string;
}

export default function BookAppt({
  text = "Book Appointment",
  className = "btn btn-success btn-lg",
}: BookApptProps) {
  return (
    <Link to="/patient/bookAppointment" className={className}>
      {text}
    </Link>
  );
}
