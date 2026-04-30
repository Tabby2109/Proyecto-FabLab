import { CalendarDays, FolderKanban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, Project, Reservation } from "../lib/api";

type ReservationStatusSummary = {
  label: string;
  color: string;
  count: number;
  percent: number;
};

function formatReservationDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-CL");
}

function getReservationBlocks(reservation: Reservation) {
  return Math.max(1, reservation.blockNumbers?.length ?? 1);
}

function getReservationStatusBuckets(reservations: Reservation[]): ReservationStatusSummary[] {
  const created = reservations.filter((item) => item.status === "PENDING").length;
  const confirmed = reservations.filter((item) => item.status === "CONFIRMED").length;
  const cancelled = reservations.filter((item) => item.status === "CANCELLED").length;
  const total = Math.max(reservations.length, 1);

  return [
    { label: "CREADA", color: "#f5a400", count: created, percent: (created / total) * 100 },
    { label: "CONFIRMADA", color: "#0d9e9a", count: confirmed, percent: (confirmed / total) * 100 },
    { label: "ANULADA", color: "#dd001d", count: cancelled, percent: (cancelled / total) * 100 }
  ];
}

function buildDonutBackground(segments: ReservationStatusSummary[]) {
  let offset = 0;

  const fills = segments
    .filter((segment) => segment.percent > 0)
    .map((segment) => {
      const start = offset;
      const end = offset + segment.percent;
      offset = end;
      return `${segment.color} ${start}% ${end}%`;
    });

  return fills.length > 0 ? `conic-gradient(${fills.join(", ")})` : "conic-gradient(#d9d9d9 0% 100%)";
}

function formatProjectType(projectType: Project["projectType"]) {
  const labels: Record<Project["projectType"], string> = {
    PRINT_3D: "Impresion 3D",
    LASER_CUT: "Corte laser",
    CNC: "CNC",
    ELECTRONICS: "Electronica",
    PROTOTYPE: "Prototipo",
    OTHER: "Otro"
  };

  return labels[projectType];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getReservations(), api.getProjects()])
      .then(([reservationsData, projectsData]) => {
        setReservations(reservationsData);
        setProjects(projectsData);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const myReservations = useMemo(
    () => reservations.filter((reservation) => reservation.user?.id === user?.id).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [reservations, user?.id]
  );

  const recentReservations = myReservations.slice(0, 5);
  const recentProjects = projects.slice(0, 3);
  const statusBuckets = getReservationStatusBuckets(myReservations);
  const donutBackground = buildDonutBackground(statusBuckets);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  return (
    <div className="portal-page dashboard-page">
      <div className="breadcrumb">Inicio</div>
      <h1 className="dashboard-title">Portal Fablab</h1>

      <section className="dashboard-layout">
        <div className="dashboard-left-stack">
          <article className="dashboard-stat-card">
            <div>
              <h2>Reservas creadas</h2>
              <strong>{myReservations.length}</strong>
            </div>
            <span className="dashboard-stat-icon dashboard-stat-icon-orange">
              <CalendarDays size={28} strokeWidth={2.2} />
            </span>
          </article>

          <article className="dashboard-stat-card">
            <div>
              <h2>Proyectos creados</h2>
              <strong>{projects.length}</strong>
            </div>
            <span className="dashboard-stat-icon dashboard-stat-icon-gray">
              <FolderKanban size={28} strokeWidth={2.2} />
            </span>
          </article>
        </div>

        <article className="dashboard-panel dashboard-panel-table">
          <h2>Mis ultimas Reservas</h2>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Maquina</th>
                <th>Proyecto asociado</th>
                <th>Fecha de reserva</th>
                <th>Bloques</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.length > 0 ? (
                recentReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.machine.name}</td>
                    <td>{reservation.project?.name ?? reservation.title}</td>
                    <td>{formatReservationDate(reservation.startAt)}</td>
                    <td>{getReservationBlocks(reservation)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="dashboard-table-empty">
                    No tiene reservas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="dashboard-panel dashboard-panel-message">
          <h2>Mis ultimos Proyectos</h2>
          <div className="dashboard-empty-state">
            {recentProjects.length > 0 ? (
              <div className="dashboard-project-list">
                {recentProjects.map((project) => (
                  <div key={project.id} className="dashboard-project-item">
                    <strong>{project.name}</strong>
                    <span>{formatProjectType(project.projectType)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                No tiene proyectos registrados. Dirijase a la seccion <strong>'Mis proyectos'</strong> o haga click <a href="/mis-proyectos">aqui</a> para registrar un proyecto y poder empezar a reservar maquinas.
              </p>
            )}
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel-donut">
          <h2>Estados Reservas</h2>
          <div className="dashboard-donut-wrap">
            <div className="dashboard-donut" style={{ backgroundImage: donutBackground }}>
              <div className="dashboard-donut-center">
                <span>TOTAL</span>
                <strong>{myReservations.length}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-legend">
            {statusBuckets.map((segment) => (
              <div key={segment.label} className="dashboard-legend-item">
                <span className="dashboard-legend-dot" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
