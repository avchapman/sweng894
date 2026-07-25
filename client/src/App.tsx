import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ChildProfilesPage from "./pages/ChildProfilesPage";
import EnrollmentRequestsPage from "./pages/EnrollmentRequestsPage";
import SchedulesPage from "./pages/SchedulesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/child-profiles" element={<ChildProfilesPage />} />
        <Route path="/enrollment" element={<EnrollmentRequestsPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
