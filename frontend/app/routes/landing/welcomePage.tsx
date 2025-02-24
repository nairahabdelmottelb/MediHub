import Departments from "~/components/landing/Departments";
import Footer from "~/components/landing/Footer";
import Navbar from "~/components/landing/Navbar";
import WelcomeHero from "~/components/landing/WelcomeHero";

export default function WelcomePage() {
  return (
    <>
      <Navbar />
      <WelcomeHero />
      <Departments />
      <Footer />
    </>
  );
}
