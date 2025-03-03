export default function WelcomeHero() {
  return (
    <>
      <section
        className="hero vh-100 d-flex align-items-center"
        style={{
          backgroundImage: 'url("images/team.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div
                className="mission-box p-5 rounded-4 shadow"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.75)",
                }}
              >
                <h1 className="text-primary mb-4">Your Health, Our Priority</h1>
                <p className="lead text-secondary mb-4">
                  At MediHub, we combine cutting-edge medical technology with
                  compassionate care to provide exceptional healthcare services
                  for all our patients.
                </p>
                <button className="btn btn-success btn-lg">
                  <i className="fas fa-calendar-check me-2"></i>Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
