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
    route("dashboard", "routes/doctordashboard/drdashboard.tsx"),
    route("calendar", "routes/doctordashboard/calendar.tsx"),
    route("newAppointment", "routes/doctordashboard/newAppointment.tsx"),
    route(
      "createPrescription",
      "routes/doctordashboard/createPrescription.tsx"
    ),
    route("addMedicalRecord", "routes/doctordashboard/addMedicalRecord.tsx"),
    route("manageSchedule", "routes/doctordashboard/manageSchedule.tsx"),
    route("appointments", "routes/doctordashboard/drAppointments.tsx"),
    route("medications", "routes/doctordashboard/drMedications.tsx"),
    route("tests", "routes/doctordashboard/drTests.tsx"),
    route("transcriptions", "routes/doctordashboard/drTranscriptions.tsx"),
    route("records", "routes/doctordashboard/drRecords.tsx"),
    route("predict", "routes/doctordashboard/drPredict.tsx"),
  ]),
  route("admin", "components/adminDashboard/AdminDashboardLayout.tsx", [
    route("dashboard", "routes/admindashboard/adminDashboard.tsx"),
    route("businessanalytics", "routes/admindashboard/businessAnalytics.tsx"),
    route("managedoc", "routes/admindashboard/manageDoctors.tsx"),
    route("managepatient", "routes/admindashboard/managePatients.tsx"),
    route("medicalanalytics", "routes/admindashboard/medicalAnalytics.tsx"),
  ]),
] satisfies RouteConfig;
