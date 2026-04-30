import { Quotation, ServiceRequest } from "./api";

export function formatCurrency(value: number | string) {
  const numericValue = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function getQuotedTotal(quotation?: Quotation | null) {
  return quotation ? Number(quotation.totalCost) : 0;
}

export function getEstimatedCost(serviceRequest: Pick<ServiceRequest, "estimatedCost">) {
  return Number(serviceRequest.estimatedCost);
}

export function getEstimatedMinutes(serviceRequest: Pick<ServiceRequest, "estimatedDurationMinutes">) {
  return Number(serviceRequest.estimatedDurationMinutes);
}
