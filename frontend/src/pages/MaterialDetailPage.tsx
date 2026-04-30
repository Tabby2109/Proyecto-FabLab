import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, AdminMaterial } from "../lib/api";

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("es-CL");
}

export function MaterialDetailPage() {
  const { materialId = "" } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<AdminMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMaterialById(materialId)
      .then(setMaterial)
      .catch((err: Error) => setError(err.message));
  }, [materialId]);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!material) {
    return <div className="content-card">Cargando material...</div>;
  }

  return (
    <div className="portal-page">
      <div className="breadcrumb">Inicio &gt; staff &gt; materiales &gt; {material.name}</div>
      <div className="project-detail-head">
        <div>
          <h1 className="page-title project-detail-title">{material.name}</h1>
          <p className="project-detail-subtitle">Detalle de material y movimientos recientes.</p>
        </div>
        <div className="project-detail-actions">
          <button type="button" className="secondary-button" onClick={() => navigate("/staff/materiales")}>
            Volver
          </button>
        </div>
      </div>

      <section className="project-detail-grid">
        <article className="content-card project-detail-card">
          <div className="project-meta-grid">
            <div>
              <span>Stock total</span>
              <strong>{material.stockQuantity.toFixed(2)} {material.unit}</strong>
            </div>
            <div>
              <span>Reservado</span>
              <strong>{material.reservedQuantity.toFixed(2)} {material.unit}</strong>
            </div>
            <div>
              <span>Disponible</span>
              <strong>{material.availableQuantity.toFixed(2)} {material.unit}</strong>
            </div>
            <div>
              <span>Minimo</span>
              <strong>{material.stockThreshold.toFixed(2)} {material.unit}</strong>
            </div>
          </div>
        </article>

        <article className="content-card project-detail-card field-span-2">
          <div className="project-detail-card-head">
            <h2>Movimientos de stock</h2>
          </div>
          <div className="stack-list">
            {material.movements.map((movement) => (
              <div key={movement.id} className="stack-row">
                <div>
                  <strong>{movement.type}</strong>
                  <p>{movement.reason ?? "Sin detalle adicional."}</p>
                  <p>{formatDateTime(movement.createdAt)}</p>
                </div>
                <div>
                  <strong>{movement.quantity.toFixed(2)}</strong>
                  <p>Stock: {movement.resultingStockQuantity.toFixed(2)}</p>
                  <p>Reservado: {movement.resultingReservedQuantity.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
