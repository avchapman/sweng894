import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ChildProfilesPage from "./pages/ChildProfilesPage";
import EnrollmentRequestsPage from "./pages/EnrollmentRequestsPage";
import SchedulesPage from "./pages/SchedulesPage";
import ParentProfilePage from "./pages/ParentProfilePage";
import ParentSchedulePage from "./pages/ParentSchedulePage";
import MessagesPage from "./pages/MessagesPage";
import { useAuth } from "./context/AuthContext";

function HomeRedirect() {
  const { user } = useAuth();
  return (
    <Navigate
      to={user?.role === "PARENT" ? "/my-child" : "/dashboard"}
      replace
    />
  );
}

function RoleRoute({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? children : <HomeRedirect />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={
            <RoleRoute roles={["ADMIN", "STAFF"]}>
              <DashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/child-profiles"
          element={
            <RoleRoute roles={["ADMIN", "STAFF"]}>
              <ChildProfilesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/enrollment"
          element={
            <RoleRoute roles={["ADMIN", "STAFF"]}>
              <EnrollmentRequestsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/schedules"
          element={
            <RoleRoute roles={["ADMIN", "STAFF"]}>
              <SchedulesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <RoleRoute roles={["ADMIN", "STAFF"]}>
              <MessagesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/my-child"
          element={
            <RoleRoute roles={["PARENT"]}>
              <ParentProfilePage />
            </RoleRoute>
          }
        />
        <Route
          path="/my-schedule"
          element={
            <RoleRoute roles={["PARENT"]}>
              <ParentSchedulePage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
