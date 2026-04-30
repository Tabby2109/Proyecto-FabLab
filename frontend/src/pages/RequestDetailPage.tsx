import { CalendarDays, FileText, FolderKanban, Layers3, Package, Receipt } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, resolveApiUrl, ServiceRequestDetail } from "../lib/api";
import { formatCurrency, getEstimatedCost, getEstimatedMinutes } from "../lib/quotationUtils";
import { formatFileSize } from "../lib/requestFiles";
import { formatOperationalStage, formatQuotationStatus, formatRequestStatus, formatReservationStatus, formatSlaStatus } from "../lib/statusUtils";

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-CL");
}

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("es-CL");
}

export function RequestDetailPage() {
  const { requestId = "" } = useParams();
  const navigate = useNavigate();
  const [requestDetail, setRequestDetail] = useState<ServiceRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [decisionReason, setDecisionReason] = useState("");

  useEffect(() => {
    api
      .getRequestById(requestId)
      .then(setRequestDetail)
      .catch((err: Error) => setError(err.message));
  }, [requestId]);

  async function submitQuotationDecision(decision: "ACCEPT" | "REJECT") {
    setError(null);
    setMessage(null);

    try {
      const updated = await api.decideQuotation(requestId, {
        decision,
        reason: decisionReason
      });
      setRequestDetail(updated);
      setDecisionReason("");
      setMessage(decision === "ACCEPT" ? "Cotizacion aceptada correctamente." : "Cotizacion rechazada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la cotizacion.");
    }
  }

  async function handleQuotationAccept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuotationDecision("ACCEPT");
  }

  if (error && !requestDetail) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!requestDetail) {
    return <div className="content-card">Cargando solicitud...</div>;
  }

  const estimatedMinutes = getEstimatedMinutes(requestDetail);
  const estimatedCost = getEstimatedCost(requestDetail);
  const quotedMinutes = requestDetail.quotation?.estimatedMinutes ?? 0;
  const quotedTotal = requestDetail.quotation ? Number(requestDetail.quotation.totalCost) : 0;
  const canReserve =
    requestDetail.status === "APPROVED" &&
    (requestDetail.quotationStatus === "ACCEPTED" || (requestDetail.quotationStatus === "NOT_REQUESTED" && !requestDetail.quotation));

  return (
    <div className="portal-page project-detail-page">
      <div className="breadcrumb">Inicio &gt; solicitudes &gt; {requestDetail.id}</div>

      <div className="project-detail-head">
        <div>
          <h1 className="page-title project-detail-title">{requestDetail.title}</h1>
          <p className="project-detail-subtitle">{requestDetail.description}</p>
        </div>

        <div className="project-detail-actions">
          <button type="button" className="secondary-button" onClick={() => navigate("/mis-solicitudes")}>
            Volver
          </button>
          {canReserve ? (
            <button type="button" className="primary-button project-detail-primary" onClick={() => navigate(`/mis-reservas/nueva?requestId=${requestDetail.id}`)}>
              <CalendarDays size={16} />
              <span>Crear reserva</span>
            </button>
          ) : null}
          <button type="button" className="primary-button project-detail-primary" onClick={() => navigate(`/mis-proyectos/${requestDetail.project.id}`)}>
            <FolderKanban size={16} />
            <span>Ir al proyecto</span>
          </button>
        </div>
      </div>

      {message ? <p className="feedback-success">{message}</p> : null}
      {error ? <p className="feedback-error">{error}</p> : null}

      <section className="project-detail-grid">
        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Layers3 size={18} />
            <h2>Ficha de la solicitud</h2>
          </div>

          <div className="project-meta-grid">
            <div>
              <span>Estado</span>
              <strong>{formatRequestStatus(requestDetail.status)}</strong>
            </div>
            <div>
              <span>Cotizacion</span>
              <strong>{formatQuotationStatus(requestDetail.quotationStatus)}</strong>
            </div>
            <div>
              <span>Etapa operativa</span>
              <strong>{formatOperationalStage(requestDetail.operationalStage)}</strong>
            </div>
            <div>
              <span>Proyecto</span>
              <strong>{requestDetail.project.name}</strong>
            </div>
            <div>
              <span>Maquina sugerida</span>
              <strong>{requestDetail.machine.name}</strong>
            </div>
            <div>
              <span>Material deseado</span>
              <strong>{requestDetail.material?.name ?? "Sin material"}</strong>
            </div>
            <div>
              <span>Consumo proyectado</span>
              <strong>
                {requestDetail.material ? `${requestDetail.materialUnitsRequested.toFixed(2)} ${requestDetail.material.unit}` : "Sin material"}
              </strong>
            </div>
            <div>
              <span>Cantidad</span>
              <strong>{requestDetail.quantity}</strong>
            </div>
            <div>
              <span>Plazo solicitado</span>
              <strong>{formatDate(requestDetail.requestedDate)}</strong>
            </div>
            <div>
              <span>Tiempo estimado</span>
              <strong>{requestDetail.estimatedDurationMinutes} min</strong>
            </div>
            <div>
              <span>Responsable interno</span>
              <strong>{requestDetail.assignedStaff?.name ?? "Por asignar"}</strong>
            </div>
            <div>
              <span>Fecha compromiso</span>
              <strong>{requestDetail.commitmentDate ? formatDate(requestDetail.commitmentDate) : "Por definir"}</strong>
            </div>
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <CalendarDays size={18} />
            <h2>Seguimiento</h2>
          </div>

          <div className="request-status-summary">
            <div className="request-status-box">
              <span>Estado de solicitud</span>
              <strong>{formatRequestStatus(requestDetail.status)}</strong>
            </div>
            <div className="request-status-box">
              <span>Estado de cotizacion</span>
              <strong>{formatQuotationStatus(requestDetail.quotationStatus)}</strong>
            </div>
            <div className="request-status-box">
              <span>SLA</span>
              <strong>{formatSlaStatus(requestDetail.slaStatus)}</strong>
            </div>
          </div>

          <div className="request-notes-block">
            <strong>Notas para el equipo</strong>
            <p>{requestDetail.notes?.trim() || "Sin notas adicionales."}</p>
          </div>

          {requestDetail.material ? (
            <div className={requestDetail.material.lowStock ? "request-notes-block inventory-warning-block" : "request-notes-block"}>
              <strong>Estado del material</strong>
              <p>
                Disponibilidad proyectada: {requestDetail.material.availableQuantity.toFixed(2)} {requestDetail.material.unit}. Stock total:{" "}
                {requestDetail.material.stockQuantity.toFixed(2)} {requestDetail.material.unit}. Reservado: {requestDetail.material.reservedQuantity.toFixed(2)}{" "}
                {requestDetail.material.unit}.
              </p>
              {requestDetail.material.lowStock ? <p>Hay stock bajo para este material. El equipo podria ajustar plazo, cantidad o material sugerido.</p> : null}
            </div>
          ) : null}

          <div className="request-notes-block">
            <strong>Comentarios del equipo</strong>
            <div className="request-comment-list">
              {requestDetail.comments.length > 0 ? (
                requestDetail.comments.map((comment) => (
                  <div key={comment.id} className="request-comment-item">
                    <div className="request-comment-head">
                      <strong>{comment.author?.name ?? "Equipo FabLab"}</strong>
                    </div>
                    <p>{comment.body}</p>
                    <span className="request-comment-date">{formatDateTime(comment.createdAt)}</span>
                  </div>
                ))
              ) : (
                <p>No hay comentarios visibles aun.</p>
              )}
            </div>
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Receipt size={18} />
            <h2>Cotizacion</h2>
          </div>

          {requestDetail.quotation ? (
            <div className="quotation-breakdown">
              <div className="quotation-row">
                <span>Preparacion</span>
                <strong>{formatCurrency(requestDetail.quotation.setupCost)}</strong>
              </div>
              <div className="quotation-row">
                <span>Uso de maquina</span>
                <strong>{formatCurrency(requestDetail.quotation.machineCost)}</strong>
              </div>
              <div className="quotation-row">
                <span>Material</span>
                <strong>{formatCurrency(requestDetail.quotation.materialCost)}</strong>
              </div>
              <div className="quotation-row quotation-row-total">
                <span>Total</span>
                <strong>{formatCurrency(requestDetail.quotation.totalCost)}</strong>
              </div>
              <p className="quotation-note">{requestDetail.quotation.notes?.trim() || "Sin observaciones adicionales en la cotizacion."}</p>

              {requestDetail.quotationStatus === "READY" ? (
                <form className="quotation-decision-form" onSubmit={handleQuotationAccept}>
                  <label>
                    <span className="field-head">
                      <span className="field-title">Observacion de respuesta</span>
                    </span>
                    <textarea rows={3} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} />
                  </label>

                  <div className="quotation-decision-actions">
                    <button type="button" className="secondary-button" onClick={() => void submitQuotationDecision("REJECT")}>
                      Rechazar
                    </button>
                    <button type="submit" className="primary-button">
                      Aceptar cotizacion
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : (
            <p className="inline-note">Aun no hay una cotizacion formal emitida para esta solicitud.</p>
          )}
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <CalendarDays size={18} />
            <h2>Comparacion estimada</h2>
          </div>

          <div className="quotation-compare-grid">
            <div className="quotation-compare-box">
              <span>Tiempo solicitado</span>
              <strong>{estimatedMinutes} min</strong>
            </div>
            <div className="quotation-compare-box">
              <span>Tiempo cotizado</span>
              <strong>{requestDetail.quotation ? `${quotedMinutes} min` : "Pendiente"}</strong>
            </div>
            <div className="quotation-compare-box">
              <span>Costo estimado</span>
              <strong>{formatCurrency(estimatedCost)}</strong>
            </div>
            <div className="quotation-compare-box">
              <span>Costo cotizado</span>
              <strong>{requestDetail.quotation ? formatCurrency(quotedTotal) : "Pendiente"}</strong>
            </div>
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Package size={18} />
            <h2>Archivos tecnicos</h2>
          </div>

          <div className="request-file-list request-file-list-detail">
            {requestDetail.requestFiles.length > 0 ? (
              requestDetail.requestFiles.map((file) => (
                <div key={file.id} className="request-file-item">
                  <div>
                    <strong>{file.originalName}</strong>
                    <span>
                      {file.extension.toUpperCase()} - {formatFileSize(file.sizeBytes)}
                    </span>
                  </div>
                  <a href={resolveApiUrl(file.publicUrl)} target="_blank" rel="noreferrer" className="machine-detail-download">
                    Descargar
                  </a>
                </div>
              ))
            ) : (
              <p>No hay archivos adjuntos para esta solicitud.</p>
            )}
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <FileText size={18} />
            <h2>Reservas relacionadas</h2>
          </div>

          <div className="project-related-list">
            {requestDetail.reservations.length > 0 ? (
              requestDetail.reservations.map((reservation) => (
                <div key={reservation.id} className="project-related-item">
                  <div>
                    <strong>{reservation.machine.name}</strong>
                    <p>{formatDate(reservation.startAt)}</p>
                  </div>
                  <div className="project-related-statuses">
                    <span>{formatReservationStatus(reservation.status)}</span>
                    <button type="button" className="projects-row-action" onClick={() => navigate(`/mis-reservas/${reservation.id}`)}>
                      Ver reserva
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>Esta solicitud aun no tiene reservas vinculadas.</p>
            )}
          </div>
        </article>

        <article className="content-card project-detail-card field-span-2">
          <div className="project-detail-card-head">
            <CalendarDays size={18} />
            <h2>Historial de la solicitud</h2>
          </div>

          <div className="project-timeline">
            {requestDetail.events.map((event) => (
              <div key={event.id} className="project-timeline-item">
                <span className="project-timeline-date">{formatDateTime(event.createdAt)}</span>
                <strong>{event.summary}</strong>
                <p>
                  {event.detail ? `${event.detail} ` : ""}
                  {event.actor?.name ? `(${event.actor.name})` : ""}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
