import { createBrowserRouter, RouterProvider } from 'react-router';
import DashboardLayout from '~/components/patientDashboard/DashboardLayout';
import Home from './home';
import Calendar from './calendar';
import Alerts from './alerts';
import Tests from './tests';
import History from './history';
import Medications from './medications';
import Doctors from './doctors';

const router = createBrowserRouter([
  {
    path: '/patient',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Home />,
      },
      {
        path: 'calendar',
        element: <Calendar />,
      },
      {
        path: 'alerts',
        element: <Alerts />,
      },
      {
        path: 'tests',
        element: <Tests />,
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'medications',
        element: <Medications />,
      },
      {
        path: 'doctors',
        element: <Doctors />,
      },
    ],
  },
]);

export default function PatientRoutes() {
  return <RouterProvider router={router} />;
} 