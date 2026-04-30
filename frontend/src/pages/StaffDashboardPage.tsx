import { AlertTriangle, Boxes, Clock3, LayoutDashboard, UserRoundX } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, StaffDashboardResponse } from "../lib/api";
import { formatRequestStatus } from "../lib/statusUtils";

export function StaffDashboardPage() {
  const [dashboard, setDashboard] = useState<StaffDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStaffDashboard()
      .then(setDashboard)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!dashboard) {
    return <div className="content-card">Cargando dashboard operativo...</div>;
  }

  return (
    <div className="portal-page staff-dashboard-page">
      <div className="breadcrumb">Inicio &gt; staff &gt; dashboard</div>
      <h1 className="page-title">Dashboard operacional</h1>

      <section className="staff-metrics-grid">
        <article className="dashboard-stat-card">
          <div>
            <h2>Solicitudes abiertas</h2>
            <strong>{dashboard.metrics.totalOpenRequests}</strong>
          </div>
          <span className="dashboard-stat-icon dashboard-stat-icon-orange">
            <LayoutDashboard size={26} />
          </span>
        </article>
        <article className="dashboard-stat-card">
          <div>
            <h2>Solicitudes atrasadas</h2>
            <strong>{dashboard.metrics.overdueRequests}</strong>
          </div>
          <span className="dashboard-stat-icon dashboard-stat-icon-red">
            <AlertTriangle size={26} />
          </span>
        </article>
        <article className="dashboard-stat-card">
          <div>
            <h2>Sin responsable</h2>
            <strong>{dashboard.metrics.unassignedRequests}</strong>
          </div>
          <span className="dashboard-stat-icon dashboard-stat-icon-gray">
            <UserRoundX size={26} />
          </span>
        </article>
        <article className="dashboard-stat-card">
          <div>
            <h2>Materiales criticos</h2>
            <strong>{dashboard.criticalMaterials.length}</strong>
          </div>
          <span className="dashboard-stat-icon dashboard-stat-icon-blue">
            <Boxes size={26} />
          </span>
        </article>
      </section>

      <section className="staff-dashboard-layout">
        <article className="content-card">
          <div className="content-card-head">
            <h2>Reportes rapidos</h2>
            <Link to="/staff/solicitudes">Abrir tablero</Link>
          </div>
          <div className="staff-report-grid">
            <div className="quotation-compare-box">
              <span>Tiempo promedio a cotizacion</span>
              <strong>{dashboard.averageTimes.quotationMinutes} min</strong>
            </div>
            <div className="quotation-compare-box">
              <span>Tiempo promedio a entrega</span>
              <strong>{dashboard.averageTimes.completionMinutes} min</strong>
            </div>
          </div>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.requestsByStatus.map((row) => (
                <tr key={row.status}>
                  <td>{formatRequestStatus(row.status)}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="content-card">
          <div className="content-card-head">
            <h2>Maquinas mas usadas</h2>
            <Clock3 size={18} />
          </div>

          <div className="staff-machine-usage">
            {dashboard.machineUsage.map((item) => (
              <div key={item.machineName} className="staff-machine-usage-item">
                <strong>{item.machineName}</strong>
                <span>{item.count} reservas</span>
                <span>{item.blocks} bloques</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="content-card-head">
            <h2>Materiales criticos</h2>
            <AlertTriangle size={18} />
          </div>

          <div className="staff-critical-materials">
            {dashboard.criticalMaterials.map((material) => (
              <div key={material.id} className="staff-critical-material">
                <strong>{material.name}</strong>
                <span>
                  Disponible {material.availableQuantity.toFixed(2)} {material.unit}
                </span>
                <span>
                  Minimo {material.stockThreshold.toFixed(2)} {material.unit}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
