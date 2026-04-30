import { CalendarDays, Clock3, FileText, FolderKanban, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectDetail } from "../lib/api";
import { api } from "../lib/api";
import { formatProjectStatus, formatQuotationStatus, formatRequestStatus, formatReservationStatus } from "../lib/statusUtils";

type TimelineItem = {
  id: string;
  date: string;
  title: string;
  description: string;
};

function formatProjectType(projectType: ProjectDetail["projectType"]) {
  const labels: Record<ProjectDetail["projectType"], string> = {
    PRINT_3D: "Impresion 3D",
    LASER_CUT: "Corte laser",
    CNC: "CNC",
    ELECTRONICS: "Electronica",
    PROTOTYPE: "Prototipo",
    OTHER: "Otro"
  };

  return labels[projectType];
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-CL");
}

function buildTimeline(project: ProjectDetail): TimelineItem[] {
  return [
    {
      id: `${project.id}-created`,
      date: project.createdAt,
      title: "Proyecto creado",
      description: `Se registro el proyecto ${project.name}.`
    },
    ...project.requests.map((request) => ({
      id: request.id,
      date: request.createdAt ?? request.requestedDate,
      title: "Solicitud registrada",
      description: `${request.title} - ${formatRequestStatus(request.status)} / ${formatQuotationStatus(request.quotationStatus)}.`
    })),
    ...project.reservations.map((reservation) => ({
      id: reservation.id,
      date: reservation.createdAt,
      title: "Reserva asociada",
      description: `${reservation.machine.name} - ${formatReservationStatus(reservation.status)}.`
    }))
  ].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
}

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProjectById(projectId)
      .then(setProject)
      .catch((err: Error) => setError(err.message));
  }, [projectId]);

  const timeline = useMemo(() => (project ? buildTimeline(project) : []), [project]);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!project) {
    return <div className="content-card">Cargando proyecto...</div>;
  }

  return (
    <div className="portal-page project-detail-page">
      <div className="breadcrumb">Inicio &gt; proyectos &gt; {project.id}</div>

      <div className="project-detail-head">
        <div>
          <h1 className="page-title project-detail-title">{project.name}</h1>
          <p className="project-detail-subtitle">{project.description}</p>
        </div>

        <div className="project-detail-actions">
          <button type="button" className="secondary-button" onClick={() => navigate("/mis-proyectos")}>
            Volver
          </button>
          <button type="button" className="primary-button project-detail-primary" onClick={() => navigate(`/nueva-solicitud?projectId=${project.id}`)}>
            <Plus size={16} />
            <span>Nueva solicitud</span>
          </button>
        </div>
      </div>

      <section className="project-detail-grid">
        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <FolderKanban size={18} />
            <h2>Ficha del proyecto</h2>
          </div>

          <div className="project-meta-grid">
            <div>
              <span>Estado</span>
              <strong>{formatProjectStatus(project.status)}</strong>
            </div>
            <div>
              <span>Tipo</span>
              <strong>{formatProjectType(project.projectType)}</strong>
            </div>
            <div>
              <span>Modalidad</span>
              <strong>{project.scope === "GROUP" ? "Grupal" : "Individual"}</strong>
            </div>
            <div>
              <span>Periodo</span>
              <strong>{project.academicPeriod ?? "Sin definir"}</strong>
            </div>
            <div>
              <span>Curso</span>
              <strong>{project.courseName ?? "Sin definir"}</strong>
            </div>
            <div>
              <span>Docente</span>
              <strong>{project.professorName ?? "Sin definir"}</strong>
            </div>
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Clock3 size={18} />
            <h2>Timeline</h2>
          </div>

          <div className="project-timeline">
            {timeline.map((item) => (
              <div key={item.id} className="project-timeline-item">
                <span className="project-timeline-date">{formatDate(item.date)}</span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <FileText size={18} />
            <h2>Solicitudes vinculadas</h2>
          </div>

          <div className="project-related-list">
            {project.requests.length > 0 ? (
              project.requests.map((request) => (
                <div key={request.id} className="project-related-item">
                  <div>
                    <strong>{request.title}</strong>
                    <p>{request.machine.name}</p>
                    <button type="button" className="projects-row-action" onClick={() => navigate(`/mis-solicitudes/${request.id}`)}>
                      Ver detalle
                    </button>
                  </div>
                  <div className="project-related-statuses">
                    <span>{formatRequestStatus(request.status)}</span>
                    <span>{formatQuotationStatus(request.quotationStatus)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No hay solicitudes registradas para este proyecto.</p>
            )}
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <CalendarDays size={18} />
            <h2>Reservas relacionadas</h2>
          </div>

          <div className="project-related-list">
            {project.reservations.length > 0 ? (
              project.reservations.map((reservation) => (
                <div key={reservation.id} className="project-related-item">
                  <div>
                    <strong>{reservation.machine.name}</strong>
                    <p>{formatDate(reservation.startAt)}</p>
                  </div>
                  <div className="project-related-statuses">
                    <span>{formatReservationStatus(reservation.status)}</span>
                    <span>{reservation.request?.title ?? "Sin solicitud"}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No hay reservas relacionadas para este proyecto.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
