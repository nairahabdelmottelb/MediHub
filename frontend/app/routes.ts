import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  layout("components/landing/LandingLayout.tsx", [
    index("routes/landing/welcomePage.tsx"),
    route("login", "routes/auth/login.tsx"),
    route("signup", "routes/auth/register.tsx"),
    route("loginToBook", "routes/auth/logintobook.tsx"),
  ]),
  route("patient", "components/patientDashboard/DashboardLayout.tsx", [
    route("dashboard", "routes/patientDashboard/home.tsx"),
    route("tests", "routes/patientDashboard/tests.tsx"),
    route("history", "routes/patientDashboard/history.tsx"),
    route("medications", "routes/patientDashboard/medications.tsx"),
    route("doctors", "routes/patientDashboard/doctors.tsx"),
    route("bookAppointment", "routes/patientDashboard/bookAppointment.tsx"),
  ]),
  route("doctor", "components/doctorDashboard/DocDashboardLayout.tsx", [
    route("dashboard", "routes/doctorDashboard/drDashboard.tsx"),
    route("calendar", "routes/doctorDashboard/calendar.tsx"),
    route("newAppointment", "routes/doctorDashboard/newAppointment.tsx"),
    route(
      "createPrescription",
      "routes/doctorDashboard/createPrescription.tsx"
    ),
    route("addMedicalRecord", "routes/doctorDashboard/addMedicalRecord.tsx"),
    route("manageSchedule", "routes/doctorDashboard/manageSchedule.tsx"),
    route("medications", "routes/doctorDashboard/drMedications.tsx"),
    route("tests", "routes/doctorDashboard/drTests.tsx"),
    route("transcriptions", "routes/doctorDashboard/drTranscriptions.tsx"),
    route("records", "routes/doctorDashboard/drRecords.tsx"),
    route("predict", "routes/doctordashboard/drPredict.tsx"),
  ]),
  route("admin", "components/AdminDashboard/AdminDashboardLayout.tsx", [
    route("dashboard", "routes/adminDashboard/adminDashboard.tsx"),
    route("businessanalytics", "routes/adminDashboard/businessAnalytics.tsx"),
    route("managedoc", "routes/adminDashboard/manageDoctors.tsx"),
    route("managepatient", "routes/adminDashboard/managePatients.tsx"),
    route("medicalanalytics", "routes/adminDashboard/medicalAnalytics.tsx"),
  ]),
] satisfies RouteConfig;
