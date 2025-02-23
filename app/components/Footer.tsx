export default function Footer() {
  return (
    <footer className="bg-primary text-white py-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <h5>Contact Us</h5>
            <ul className="list-unstyled">
              <li>
                <i className="fas fa-phone me-2"></i>(555) 123-4567
              </li>
              <li>
                <i className="fas fa-envelope me-2"></i>help@medihub.com
              </li>
              <li>
                <i className="fas fa-map-marker-alt me-2"></i>123 Health Street
              </li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li>
                <a href="#privacy" className="text-white text-decoration-none">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-white text-decoration-none">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#careers" className="text-white text-decoration-none">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Follow Us</h5>
            <div className="d-flex gap-3">
              <a href="#" className="text-white">
                <i className="fab fa-facebook fa-2x"></i>
              </a>
              <a href="#" className="text-white">
                <i className="fab fa-twitter fa-2x"></i>
              </a>
              <a href="#" className="text-white">
                <i className="fab fa-linkedin fa-2x"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
