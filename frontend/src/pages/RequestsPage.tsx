import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ServiceRequest } from "../lib/api";
import { formatQuotationStatus, formatRequestStatus } from "../lib/statusUtils";

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-CL");
}

export function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRequests()
      .then(setRequests)
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return requests;
    }

    return requests.filter((request) =>
      [request.title, request.project.name, request.machine.name, request.material?.name ?? "", formatRequestStatus(request.status), formatQuotationStatus(request.quotationStatus)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [requests, search]);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  return (
    <div className="portal-page projects-page">
      <div className="breadcrumb">Inicio &gt; solicitudes</div>
      <h1 className="page-title">Mis solicitudes</h1>

      <div className="projects-toolbar">
        <label className="projects-search" aria-label="Buscar solicitud">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" />
          <Search size={20} />
        </label>
      </div>

      <div className="projects-table-wrap">
        <table className="projects-table requests-table">
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Proyecto</th>
              <th>Maquina</th>
              <th>Material</th>
              <th>Plazo</th>
              <th>Estado</th>
              <th>Cotizacion</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.title}</td>
                  <td>{request.project.name}</td>
                  <td>{request.machine.name}</td>
                  <td>
                    <div className="request-table-material">
                      <strong>{request.material?.name ?? "Sin material"}</strong>
                      {request.material?.lowStock ? <span className="inventory-inline-warning">Stock bajo</span> : null}
                    </div>
                  </td>
                  <td>{formatDate(request.requestedDate)}</td>
                  <td>
                    <span className={`status-pill ${request.status.toLowerCase().replace(/_/g, "-")}`}>{formatRequestStatus(request.status)}</span>
                  </td>
                  <td>
                    <span className={`status-pill quotation-${request.quotationStatus.toLowerCase().replace(/_/g, "-")}`}>{formatQuotationStatus(request.quotationStatus)}</span>
                  </td>
                  <td>
                    <button type="button" className="projects-row-action" onClick={() => navigate(`/mis-solicitudes/${request.id}`)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="projects-empty-cell">
                  No se han encontrado solicitudes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
