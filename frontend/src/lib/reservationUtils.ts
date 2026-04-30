import { Machine, Reservation, ReservationPayload } from "./api";
import { reservationBlocks } from "./reservationBlocks";

export function getReservationBadgeClass(status: Reservation["status"]) {
  if (status === "CANCELLED") {
    return "reservation-status reservation-status-cancelled";
  }

  if (status === "CONFIRMED") {
    return "reservation-status reservation-status-confirmed";
  }

  if (status === "COMPLETED") {
    return "reservation-status reservation-status-completed";
  }

  return "reservation-status reservation-status-pending";
}

export function formatMachineCategory(category: Machine["category"]) {
  const labels: Record<Machine["category"], string> = {
    PRINT_3D: "Impresoras 3D",
    LASER: "Cortadoras laser",
    CNC: "CNC",
    ELECTRONICS: "Electronica",
    VINYL: "Vinilo"
  };

  return labels[category];
}

export function toDateInputValue(dateValue: string) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(dateValue: string) {
  return new Intl.DateTimeFormat("es-CL", { weekday: "long" }).format(new Date(dateValue)).replace(/^./, (char) => char.toUpperCase());
}

export function shiftDate(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map((value) => Number(value));
  const nextDate = new Date(year, month - 1, day, 12, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + days);
  return toDateInputValue(nextDate.toISOString());
}

export function getWeekDates(dateValue: string) {
  return Array.from({ length: 7 }, (_, index) => shiftDate(dateValue, index));
}

export function estimateBlockCount(minutes: number, minBlocks: number, maxBlocks: number) {
  const rawValue = Math.max(1, Math.ceil(minutes / 35));
  return Math.min(maxBlocks, Math.max(minBlocks, rawValue));
}

export function buildReservationPayload(form: {
  projectId: string;
  requestId?: string;
  machineId: string;
  date: string;
  description: string;
  blockNumbers: number[];
}, reservation: Pick<Reservation, "project" | "request" | "title" | "notes" | "status">): ReservationPayload {
  const orderedBlocks = [...form.blockNumbers].sort((left, right) => left - right);
  const firstBlock = reservationBlocks.find((block) => block.number === orderedBlocks[0]) ?? reservationBlocks[0];
  const lastBlock = reservationBlocks.find((block) => block.number === orderedBlocks[orderedBlocks.length - 1]) ?? reservationBlocks[0];
  const [year, month, day] = form.date.split("-").map((value) => Number(value));
  const startAt = new Date(year, month - 1, day, firstBlock.hour, firstBlock.minute, 0, 0);
  const endAt = new Date(year, month - 1, day, lastBlock.endHour, lastBlock.endMinute, 0, 0);

  return {
    projectId: form.projectId || null,
    requestId: form.requestId || reservation.request?.id || null,
    machineId: form.machineId,
    title: reservation.project?.name ?? reservation.title,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    description: form.description,
    notes: reservation.notes ?? "",
    blockNumbers: orderedBlocks,
    status: reservation.status
  };
}
