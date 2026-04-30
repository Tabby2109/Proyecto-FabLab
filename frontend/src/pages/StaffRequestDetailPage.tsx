import { CalendarDays, FileText, Layers3, MessageSquare, Package, Receipt, UserRoundCog, Workflow } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, resolveApiUrl, ServiceRequestDetail, StaffRequestActionPayload, StaffMetaResponse, StaffRequestOpsPayload } from "../lib/api";
import { formatCurrency, getEstimatedCost, getEstimatedMinutes } from "../lib/quotationUtils";
import { formatFileSize } from "../lib/requestFiles";
import { formatOperationalStage, formatQuotationStatus, formatRequestStatus, formatReservationStatus, formatSlaStatus } from "../lib/statusUtils";

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-CL");
}

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("es-CL");
}

const actionOptions: Array<{ value: StaffRequestActionPayload["action"]; label: string }> = [
  { value: "ACCEPT", label: "Aceptar solicitud" },
  { value: "REQUEST_CORRECTION", label: "Pedir correccion" },
  { value: "REJECT", label: "Rechazar solicitud" },
  { value: "SEND_TO_QUOTATION", label: "Pasar a cotizacion" },
  { value: "START_PRODUCTION", label: "Iniciar fabricacion" },
  { value: "MARK_READY", label: "Marcar lista para retiro" },
  { value: "MARK_COMPLETED", label: "Marcar entregada" }
];

export function StaffRequestDetailPage() {
  const { requestId = "" } = useParams();
  const navigate = useNavigate();
  const [requestDetail, setRequestDetail] = useState<ServiceRequestDetail | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffMetaResponse["staffUsers"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<StaffRequestActionPayload["action"]>("ACCEPT");
  const [actionReason, setActionReason] = useState("");
  const [actionVisibility, setActionVisibility] = useState<"INTERNAL" | "PUBLIC">("PUBLIC");
  const [commentBody, setCommentBody] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<"INTERNAL" | "PUBLIC">("PUBLIC");
  const [opsForm, setOpsForm] = useState<StaffRequestOpsPayload>({
    assignedStaffId: "",
    commitmentDate: "",
    status: "PENDING_REVIEW"
  });
  const [quotationForm, setQuotationForm] = useState({
    setupCost: "0",
    machineCost: "0",
    materialCost: "0",
    quantity: "1",
    estimatedMinutes: "60",
    notes: ""
  });

  useEffect(() => {
    Promise.all([api.getStaffRequestById(requestId), api.getStaffMeta()])
      .then(([detail, meta]) => {
        setRequestDetail(detail);
        setStaffUsers(meta.staffUsers);
        setOpsForm({
          assignedStaffId: detail.assignedStaffId ?? "",
          commitmentDate: detail.commitmentDate ? detail.commitmentDate.slice(0, 10) : "",
          status: detail.status
        });
        setQuotationForm({
          setupCost: detail.quotation ? String(Number(detail.quotation.setupCost)) : "0",
          machineCost: detail.quotation ? String(Number(detail.quotation.machineCost)) : "0",
          materialCost: detail.quotation ? String(Number(detail.quotation.materialCost)) : "0",
          quantity: String(detail.quotation?.quantity ?? detail.quantity),
          estimatedMinutes: String(detail.quotation?.estimatedMinutes ?? detail.estimatedDurationMinutes),
          notes: detail.quotation?.notes ?? ""
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [requestId]);

  async function refresh() {
    const updated = await api.getStaffRequestById(requestId);
    setRequestDetail(updated);
    setOpsForm({
      assignedStaffId: updated.assignedStaffId ?? "",
      commitmentDate: updated.commitmentDate ? updated.commitmentDate.slice(0, 10) : "",
      status: updated.status
    });
    setQuotationForm({
      setupCost: updated.quotation ? String(Number(updated.quotation.setupCost)) : "0",
      machineCost: updated.quotation ? String(Number(updated.quotation.machineCost)) : "0",
      materialCost: updated.quotation ? String(Number(updated.quotation.materialCost)) : "0",
      quantity: String(updated.quotation?.quantity ?? updated.quantity),
      estimatedMinutes: String(updated.quotation?.estimatedMinutes ?? updated.estimatedDurationMinutes),
      notes: updated.quotation?.notes ?? ""
    });
  }

  async function handleOpsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const updated = await api.updateStaffRequestOps(requestId, {
        assignedStaffId: opsForm.assignedStaffId || null,
        commitmentDate: opsForm.commitmentDate || null,
        status: opsForm.status
      });
      setRequestDetail(updated);
      setMessage("Gestion operativa actualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la gestion operativa.");
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await api.addStaffRequestComment(requestId, {
        body: commentBody,
        visibility: commentVisibility
      });
      setCommentBody("");
      setMessage("Comentario agregado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el comentario.");
    }
  }

  async function handleActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const updated = await api.applyStaffRequestAction(requestId, {
        action,
        reason: actionReason,
        visibility: actionVisibility
      });
      setRequestDetail(updated);
      setActionReason("");
      setMessage("Accion aplicada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aplicar la accion.");
    }
  }

  async function handleQuotationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const updated = await api.upsertStaffQuotation(requestId, {
        setupCost: Number(quotationForm.setupCost),
        machineCost: Number(quotationForm.machineCost),
        materialCost: Number(quotationForm.materialCost),
        quantity: Number(quotationForm.quantity),
        estimatedMinutes: Number(quotationForm.estimatedMinutes),
        notes: quotationForm.notes
      });
      setRequestDetail(updated);
      setMessage("Cotizacion guardada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la cotizacion.");
    }
  }

  if (error && !requestDetail) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!requestDetail) {
    return <div className="content-card">Cargando solicitud...</div>;
  }

  const estimatedMinutes = getEstimatedMinutes(requestDetail);
  const estimatedCost = getEstimatedCost(requestDetail);
  const quotedTotal =
    Number(quotationForm.setupCost || 0) + Number(quotationForm.machineCost || 0) + Number(quotationForm.materialCost || 0);

  return (
    <div className="portal-page project-detail-page staff-request-detail-page">
      <div className="breadcrumb">Inicio &gt; staff &gt; solicitudes &gt; {requestDetail.id}</div>

      <div className="project-detail-head">
        <div>
          <h1 className="page-title project-detail-title">{requestDetail.title}</h1>
          <p className="project-detail-subtitle">{requestDetail.description}</p>
        </div>

        <div className="project-detail-actions">
          <button type="button" className="secondary-button" onClick={() => navigate("/staff/solicitudes")}>
            Volver
          </button>
        </div>
      </div>

      {message ? <p className="feedback-success">{message}</p> : null}
      {error ? <p className="feedback-error">{error}</p> : null}

      <section className="project-detail-grid">
        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Layers3 size={18} />
            <h2>Ficha operativa</h2>
          </div>

          <div className="project-meta-grid">
            <div>
              <span>Solicitante</span>
              <strong>{requestDetail.requester?.name ?? requestDetail.requester?.email ?? "Sin usuario"}</strong>
            </div>
            <div>
              <span>Proyecto</span>
              <strong>{requestDetail.project.name}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{formatRequestStatus(requestDetail.status)}</strong>
            </div>
            <div>
              <span>Etapa operativa</span>
              <strong>{formatOperationalStage(requestDetail.operationalStage)}</strong>
            </div>
            <div>
              <span>Cotizacion</span>
              <strong>{formatQuotationStatus(requestDetail.quotationStatus)}</strong>
            </div>
            <div>
              <span>SLA</span>
              <strong>{formatSlaStatus(requestDetail.slaStatus)}</strong>
            </div>
            <div>
              <span>Maquina sugerida</span>
              <strong>{requestDetail.machine.name}</strong>
            </div>
            <div>
              <span>Material</span>
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
              <span>Responsable interno</span>
              <strong>{requestDetail.assignedStaff?.name ?? "Sin asignar"}</strong>
            </div>
            <div>
              <span>Fecha compromiso</span>
              <strong>{requestDetail.commitmentDate ? formatDate(requestDetail.commitmentDate) : "Sin definir"}</strong>
            </div>
          </div>

          {requestDetail.material ? (
            <div className={requestDetail.material.lowStock ? "inventory-warning-block" : "request-machine-hint"}>
              <strong>Inventario del material</strong>
              <span>
                Disponible: {requestDetail.material.availableQuantity.toFixed(2)} {requestDetail.material.unit}. Reservado:{" "}
                {requestDetail.material.reservedQuantity.toFixed(2)} {requestDetail.material.unit}. Minimo:{" "}
                {requestDetail.material.stockThreshold.toFixed(2)} {requestDetail.material.unit}.
              </span>
              {requestDetail.material.lowStock ? (
                <span className="request-warning-copy">Al aprobar esta solicitud debes revisar reposicion o liberar stock si el consumo proyectado supera el margen operacional.</span>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <UserRoundCog size={18} />
            <h2>Gestion operativa</h2>
          </div>

          <form className="staff-action-form" onSubmit={handleOpsSubmit}>
            <label>
              <span className="field-head">
                <span className="field-title">Responsable interno</span>
              </span>
              <select value={opsForm.assignedStaffId ?? ""} onChange={(event) => setOpsForm({ ...opsForm, assignedStaffId: event.target.value })}>
                <option value="">Sin asignar</option>
                {staffUsers.map((staffUser) => (
                  <option key={staffUser.id} value={staffUser.id}>
                    {staffUser.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Fecha compromiso</span>
              </span>
              <input type="date" value={opsForm.commitmentDate ?? ""} onChange={(event) => setOpsForm({ ...opsForm, commitmentDate: event.target.value })} />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Estado operativo</span>
              </span>
              <select value={opsForm.status ?? requestDetail.status} onChange={(event) => setOpsForm({ ...opsForm, status: event.target.value as StaffRequestOpsPayload["status"] })}>
                <option value="PENDING_REVIEW">Pendiente revision</option>
                <option value="CHANGES_REQUESTED">Esperando correccion</option>
                <option value="IN_QUOTATION">En cotizacion</option>
                <option value="QUOTED">Cotizada</option>
                <option value="APPROVED">Lista para reservar</option>
                <option value="IN_PROGRESS">En fabricacion</option>
                <option value="READY_FOR_PICKUP">Lista para retiro</option>
                <option value="COMPLETED">Entregada</option>
                <option value="REJECTED">Rechazada</option>
              </select>
            </label>

            <button type="submit" className="primary-button">
              Guardar gestion
            </button>
          </form>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Workflow size={18} />
            <h2>Accion de staff</h2>
          </div>

          <form className="staff-action-form" onSubmit={handleActionSubmit}>
            <label>
              <span className="field-head">
                <span className="field-title">Accion</span>
              </span>
              <select value={action} onChange={(event) => setAction(event.target.value as StaffRequestActionPayload["action"])}>
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Motivo / contexto</span>
              </span>
              <textarea rows={4} value={actionReason} onChange={(event) => setActionReason(event.target.value)} />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Visibilidad del motivo</span>
              </span>
              <select value={actionVisibility} onChange={(event) => setActionVisibility(event.target.value as "INTERNAL" | "PUBLIC")}>
                <option value="PUBLIC">Visible para usuario</option>
                <option value="INTERNAL">Interno</option>
              </select>
            </label>

            <button type="submit" className="primary-button">
              Aplicar accion
            </button>
          </form>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Receipt size={18} />
            <h2>Editor de cotizacion</h2>
          </div>

          <form className="staff-action-form" onSubmit={handleQuotationSubmit}>
            <label>
              <span className="field-head">
                <span className="field-title">Costo de preparacion</span>
              </span>
              <input type="number" min="0" value={quotationForm.setupCost} onChange={(event) => setQuotationForm({ ...quotationForm, setupCost: event.target.value })} />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Costo de maquina</span>
              </span>
              <input type="number" min="0" value={quotationForm.machineCost} onChange={(event) => setQuotationForm({ ...quotationForm, machineCost: event.target.value })} />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Costo de material</span>
              </span>
              <input type="number" min="0" value={quotationForm.materialCost} onChange={(event) => setQuotationForm({ ...quotationForm, materialCost: event.target.value })} />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Cantidad cotizada</span>
              </span>
              <input type="number" min="1" value={quotationForm.quantity} onChange={(event) => setQuotationForm({ ...quotationForm, quantity: event.target.value })} />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Tiempo estimado (min)</span>
              </span>
              <input
                type="number"
                min="1"
                value={quotationForm.estimatedMinutes}
                onChange={(event) => setQuotationForm({ ...quotationForm, estimatedMinutes: event.target.value })}
              />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Total</span>
              </span>
              <input type="text" value={formatCurrency(quotedTotal)} readOnly />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Notas de cotizacion</span>
              </span>
              <textarea rows={4} value={quotationForm.notes} onChange={(event) => setQuotationForm({ ...quotationForm, notes: event.target.value })} />
            </label>

            <button type="submit" className="primary-button">
              Guardar cotizacion
            </button>
          </form>
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
              <strong>{quotationForm.estimatedMinutes} min</strong>
            </div>
            <div className="quotation-compare-box">
              <span>Costo estimado usuario</span>
              <strong>{formatCurrency(estimatedCost)}</strong>
            </div>
            <div className="quotation-compare-box">
              <span>Total cotizado</span>
              <strong>{formatCurrency(quotedTotal)}</strong>
            </div>
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <Package size={18} />
            <h2>Archivos tecnicos</h2>
          </div>

          <div className="request-file-list request-file-list-detail">
            {requestDetail.requestFiles.map((file) => (
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
            ))}
          </div>
        </article>

        <article className="content-card project-detail-card">
          <div className="project-detail-card-head">
            <MessageSquare size={18} />
            <h2>Comentarios</h2>
          </div>

          <form className="staff-comment-form" onSubmit={handleCommentSubmit}>
            <label>
              <span className="field-head">
                <span className="field-title">Nuevo comentario</span>
              </span>
              <textarea rows={4} value={commentBody} onChange={(event) => setCommentBody(event.target.value)} required />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Visibilidad</span>
              </span>
              <select value={commentVisibility} onChange={(event) => setCommentVisibility(event.target.value as "INTERNAL" | "PUBLIC")}>
                <option value="PUBLIC">Visible para usuario</option>
                <option value="INTERNAL">Interno</option>
              </select>
            </label>

            <button type="submit" className="secondary-button">
              Guardar comentario
            </button>
          </form>

          <div className="request-comment-list">
            {requestDetail.comments.length > 0 ? (
              requestDetail.comments.map((comment) => (
                <div key={comment.id} className="request-comment-item">
                  <div className="request-comment-head">
                    <strong>{comment.author?.name ?? "Equipo FabLab"}</strong>
                    <span className={comment.visibility === "INTERNAL" ? "request-comment-badge request-comment-badge-internal" : "request-comment-badge"}>
                      {comment.visibility === "INTERNAL" ? "Interno" : "Publico"}
                    </span>
                  </div>
                  <p>{comment.body}</p>
                  <span className="request-comment-date">{formatDateTime(comment.createdAt)}</span>
                </div>
              ))
            ) : (
              <p>No hay comentarios registrados.</p>
            )}
          </div>
        </article>

        <article className="content-card project-detail-card field-span-2">
          <div className="project-detail-card-head">
            <CalendarDays size={18} />
            <h2>Trazabilidad</h2>
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

        <article className="content-card project-detail-card field-span-2">
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
      </section>
    </div>
  );
}
