import { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { PrivateLayout } from "./layouts/PrivateLayout";
import { AccountSetupPage } from "./pages/AccountSetupPage";
import { AdminMachinesPage } from "./pages/AdminMachinesPage";
import { AdminMaterialsPage } from "./pages/AdminMaterialsPage";
import { AdminMachineTypesPage } from "./pages/AdminMachineTypesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { MachineSchedulePage } from "./pages/MachineSchedulePage";
import { MaterialDetailPage } from "./pages/MaterialDetailPage";
import { MachineDetailPage } from "./pages/MachineDetailPage";
import { MachinesPage } from "./pages/MachinesPage";
import { NewReservationPage } from "./pages/NewReservationPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { RequestsPage } from "./pages/RequestsPage";
import { ReservationEditPage } from "./pages/ReservationEditPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { StaffRequestDetailPage } from "./pages/StaffRequestDetailPage";
import { StaffRequestsPage } from "./pages/StaffRequestsPage";

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-boot">Cargando portal...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireCompletedProfile({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user && !user.profileCompleted) {
    return <Navigate to="/cuenta" replace state={{ from: location }} />;
  }

  return children;
}

function LoginEntry() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={user.profileCompleted ? "/" : "/cuenta"} replace />;
  }

  return <LoginPage />;
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RequireStaff({ children }: { children: ReactElement }) {
  const { user } = useAuth();

  if (!user || !["STAFF", "ADMIN"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginEntry />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <RequireAuth>
            <PrivateLayout />
          </RequireAuth>
        }
      >
        <Route path="/cuenta" element={<AccountSetupPage />} />
        <Route
          path="/"
          element={
            <RequireCompletedProfile>
              <DashboardPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-proyectos"
          element={
            <RequireCompletedProfile>
              <ProjectsPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-proyectos/:projectId"
          element={
            <RequireCompletedProfile>
              <ProjectDetailPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-solicitudes"
          element={
            <RequireCompletedProfile>
              <RequestsPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-solicitudes/:requestId"
          element={
            <RequireCompletedProfile>
              <RequestDetailPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-solicitudes/:requestId/cotizacion"
          element={
            <RequireCompletedProfile>
              <RequestDetailPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/notificaciones"
          element={
            <RequireCompletedProfile>
              <NotificationsPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-reservas"
          element={
            <RequireCompletedProfile>
              <ReservationsPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-reservas/nueva"
          element={
            <RequireCompletedProfile>
              <NewReservationPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/mis-reservas/:reservationId"
          element={
            <RequireCompletedProfile>
              <ReservationEditPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/maquinas"
          element={
            <RequireCompletedProfile>
              <MachinesPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/maquinas/:machineTypeId"
          element={
            <RequireCompletedProfile>
              <MachineDetailPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/maquinas/:machineId/agenda"
          element={
            <RequireCompletedProfile>
              <MachineSchedulePage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/nueva-solicitud"
          element={
            <RequireCompletedProfile>
              <NewRequestPage />
            </RequireCompletedProfile>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <RequireStaff>
              <StaffDashboardPage />
            </RequireStaff>
          }
        />
        <Route
          path="/staff/materiales"
          element={
            <RequireStaff>
              <AdminMaterialsPage />
            </RequireStaff>
          }
        />
        <Route
          path="/staff/materiales/:materialId"
          element={
            <RequireStaff>
              <MaterialDetailPage />
            </RequireStaff>
          }
        />
        <Route
          path="/staff/solicitudes"
          element={
            <RequireStaff>
              <StaffRequestsPage />
            </RequireStaff>
          }
        />
        <Route
          path="/staff/solicitudes/:requestId/cotizacion"
          element={
            <RequireStaff>
              <StaffRequestDetailPage />
            </RequireStaff>
          }
        />
        <Route
          path="/staff/solicitudes/:requestId"
          element={
            <RequireStaff>
              <StaffRequestDetailPage />
            </RequireStaff>
          }
        />
        <Route path="/crear-reserva" element={<Navigate to="/nueva-solicitud" replace />} />
        <Route
          path="/admin/materiales"
          element={
            <RequireStaff>
              <AdminMaterialsPage />
            </RequireStaff>
          }
        />
        <Route
          path="/admin/maquinas"
          element={
            <RequireAdmin>
              <AdminMachinesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/tipos-maquina"
          element={
            <RequireAdmin>
              <AdminMachineTypesPage />
            </RequireAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
