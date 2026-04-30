import { Project, Reservation, ServiceRequest } from "./api";

export function formatProjectStatus(status: Project["status"]) {
  const labels: Record<Project["status"], string> = {
    CREATED: "Creado",
    IN_PROGRESS: "En progreso",
    COMPLETED: "Finalizado",
    CANCELLED: "Anulado"
  };

  return labels[status];
}

export function formatRequestStatus(status: ServiceRequest["status"]) {
  const labels: Record<ServiceRequest["status"], string> = {
    DRAFT: "Borrador",
    PENDING_REVIEW: "Pendiente revision",
    CHANGES_REQUESTED: "Correcciones solicitadas",
    IN_QUOTATION: "En cotizacion",
    QUOTED: "Cotizada",
    APPROVED: "Aprobada",
    IN_PROGRESS: "En fabricacion",
    READY_FOR_PICKUP: "Lista para retiro",
    COMPLETED: "Completada",
    REJECTED: "Rechazada"
  };

  return labels[status];
}

export function formatQuotationStatus(status: ServiceRequest["quotationStatus"]) {
  const labels: Record<ServiceRequest["quotationStatus"], string> = {
    NOT_REQUESTED: "Sin cotizacion",
    PENDING: "En evaluacion",
    READY: "Lista",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
    EXPIRED: "Vencida"
  };

  return labels[status];
}

export function formatReservationStatus(status: Reservation["status"]) {
  const labels: Record<Reservation["status"], string> = {
    PENDING: "Creada",
    CONFIRMED: "Confirmada",
    CANCELLED: "Anulada",
    COMPLETED: "Completada"
  };

  return labels[status];
}

export function formatOperationalStage(stage: ServiceRequest["operationalStage"]) {
  const labels: Record<ServiceRequest["operationalStage"], string> = {
    PENDING_REVIEW: "Pendiente revision",
    IN_QUOTATION: "Cotizando",
    CHANGES_REQUESTED: "Esperando correccion",
    READY_TO_SCHEDULE: "Listo para reservar",
    IN_PRODUCTION: "En fabricacion",
    DELIVERED: "Entregado",
    OTHER: "Otro"
  };

  return labels[stage];
}

export function formatSlaStatus(status: ServiceRequest["slaStatus"]) {
  const labels: Record<ServiceRequest["slaStatus"], string> = {
    NONE: "Sin fecha compromiso",
    ON_TRACK: "En plazo",
    DUE_SOON: "Proximo a vencer",
    OVERDUE: "Atrasada"
  };

  return labels[status];
}
