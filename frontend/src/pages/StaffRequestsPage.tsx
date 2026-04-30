import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ServiceRequestDetail, StaffDashboardResponse } from "../lib/api";
import { formatOperationalStage, formatRequestStatus, formatSlaStatus } from "../lib/statusUtils";

function formatDate(dateValue?: string | null) {
  return dateValue ? new Date(dateValue).toLocaleDateString("es-CL") : "Sin fecha";
}

export function StaffRequestsPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<StaffDashboardResponse | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStaffDashboard()
      .then(setDashboard)
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredColumns = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();

    return dashboard.boardColumns.map((column) => ({
      ...column,
      items: column.items.filter((request) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          request.title,
          request.project.name,
          request.machine.name,
          request.material?.name ?? "",
          request.requester?.name ?? "",
          request.assignedStaff?.name ?? "",
          formatRequestStatus(request.status),
          formatOperationalStage(request.operationalStage)
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
    }));
  }, [dashboard, search]);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!dashboard) {
    return <div className="content-card">Cargando tablero staff...</div>;
  }

  return (
    <div className="portal-page staff-board-page">
      <div className="breadcrumb">Inicio &gt; staff &gt; solicitudes</div>
      <h1 className="page-title">Cola operacional de solicitudes</h1>

      <div className="projects-toolbar">
        <label className="projects-search" aria-label="Buscar solicitud staff">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en tablero" />
          <Search size={20} />
        </label>
      </div>

      <section className="kanban-board">
        {filteredColumns.map((column) => (
          <article key={column.key} className="kanban-column">
            <header className="kanban-column-head">
              <h2>{column.label}</h2>
              <span>{column.items.length}</span>
            </header>

            <div className="kanban-column-body">
              {column.items.length > 0 ? (
                column.items.map((request: ServiceRequestDetail) => (
                  <button key={request.id} type="button" className="kanban-card" onClick={() => navigate(`/staff/solicitudes/${request.id}`)}>
                    <div className="kanban-card-top">
                      <strong>{request.title}</strong>
                      <span className={`sla-pill sla-pill-${request.slaStatus.toLowerCase()}`}>{formatSlaStatus(request.slaStatus)}</span>
                    </div>
                    <span className="kanban-card-project">{request.project.name}</span>
                    <span className="kanban-card-machine">{request.machine.name}</span>
                    <div className="kanban-card-meta">
                      <span>{formatRequestStatus(request.status)}</span>
                      <span>{request.assignedStaff?.name ?? "Sin responsable"}</span>
                    </div>
                    <div className="kanban-card-meta">
                      <span>Compromiso {formatDate(request.commitmentDate)}</span>
                      <span>{request.material?.lowStock ? "Stock critico" : "Stock ok"}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="kanban-empty">Sin elementos en {column.label.toLowerCase()}.</div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
