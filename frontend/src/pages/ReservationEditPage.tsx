import { AlertCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Reservation, ReservationSchedule } from "../lib/api";
import { reservationBlocks } from "../lib/reservationBlocks";
import { buildReservationPayload, formatDayLabel, getReservationBadgeClass, shiftDate, toDateInputValue } from "../lib/reservationUtils";
import { formatReservationStatus } from "../lib/statusUtils";

type ReservationFormState = {
  projectId: string;
  requestId: string;
  machineId: string;
  date: string;
  description: string;
  blockNumbers: number[];
};

export function ReservationEditPage() {
  const { reservationId = "" } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [schedule, setSchedule] = useState<ReservationSchedule | null>(null);
  const [form, setForm] = useState<ReservationFormState | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getReservationById(reservationId)
      .then((reservationData) => {
        const initialDate = toDateInputValue(reservationData.startAt);
        setReservation(reservationData);
        setWeekStart(initialDate);
        setForm({
          projectId: reservationData.project?.id ?? "",
          requestId: reservationData.request?.id ?? "",
          machineId: reservationData.machine.id,
          date: initialDate,
          description: reservationData.description ?? "",
          blockNumbers: [...reservationData.blockNumbers].sort((left, right) => left - right)
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [reservationId]);

  useEffect(() => {
    if (!form?.machineId || !weekStart) {
      return;
    }

    setLoadingSchedule(true);
    api
      .getReservationSchedule(form.machineId, weekStart, form.requestId, reservationId)
      .then((nextSchedule) => {
        setSchedule(nextSchedule);
        setForm((current) => {
          if (!current) {
            return current;
          }

          const hasCurrentDay = nextSchedule.days.some((day) => day.date === current.date);
          return hasCurrentDay
            ? current
            : {
                ...current,
                date: nextSchedule.days[0]?.date ?? current.date,
                blockNumbers: []
              };
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingSchedule(false));
  }, [form?.machineId, form?.requestId, reservationId, weekStart]);

  const isLocked = useMemo(() => {
    if (!reservation) {
      return true;
    }

    return reservation.status === "CANCELLED" || reservation.status === "COMPLETED" || new Date(reservation.startAt).getTime() < Date.now();
  }, [reservation]);

  const selectedDay = useMemo(() => schedule?.days.find((day) => day.date === form?.date) ?? null, [form?.date, schedule]);
  const rules = schedule?.machine.rules;

  function toggleBlock(blockNumber: number) {
    if (!form || !selectedDay || !rules || isLocked) {
      return;
    }

    if (selectedDay.blockedBlockNumbers.includes(blockNumber)) {
      return;
    }

    const exists = form.blockNumbers.includes(blockNumber);

    if (exists) {
      setForm({
        ...form,
        blockNumbers: form.blockNumbers.filter((value) => value !== blockNumber)
      });
      return;
    }

    if (form.blockNumbers.length >= rules.maxBlocks) {
      return;
    }

    if (!rules.requiresConsecutive || form.blockNumbers.length === 0) {
      setForm({
        ...form,
        blockNumbers: [...form.blockNumbers, blockNumber].sort((left, right) => left - right)
      });
      return;
    }

    const currentMin = Math.min(...form.blockNumbers);
    const currentMax = Math.max(...form.blockNumbers);
    const canAppend = blockNumber === currentMin - 1 || blockNumber === currentMax + 1;

    if (!canAppend) {
      setError("Esta maquina requiere bloques consecutivos. Ajusta la seleccion sobre bloques contiguos.");
      return;
    }

    setError(null);
    setForm({
      ...form,
      blockNumbers: [...form.blockNumbers, blockNumber].sort((left, right) => left - right)
    });
  }

  function applySuggestedBlocks() {
    if (!schedule || !form || isLocked) {
      return;
    }

    const preferredDay = schedule.days.find((day) => day.date === form.date && day.suggestedBlockNumbers.length > 0) ?? schedule.days.find((day) => day.suggestedBlockNumbers.length > 0);

    if (!preferredDay) {
      setError("No hay una sugerencia automatica disponible para esta semana.");
      return;
    }

    setError(null);
    setForm({
      ...form,
      date: preferredDay.date,
      blockNumbers: preferredDay.suggestedBlockNumbers
    });
  }

  async function handleSave() {
    if (!reservation || !form || isLocked || form.blockNumbers.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await api.updateReservation(reservation.id, buildReservationPayload(form, reservation));
      setReservation(updated);
      setMessage("Reserva actualizada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la reserva.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !form) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!reservation || !form) {
    return <div className="content-card">Cargando reserva...</div>;
  }

  return (
    <div className="portal-page reservation-edit-page reservation-week-page">
      <div className="breadcrumb">Inicio &gt; reservas &gt; {reservation.id}</div>

      <div className="reservation-edit-head">
        <h1 className="page-title">Editar reserva</h1>
        <div className="reservation-edit-status">
          <span>Estado Reserva:</span>
          <span className={getReservationBadgeClass(reservation.status)}>{formatReservationStatus(reservation.status)}</span>
        </div>
      </div>

      <section className="reservation-edit-layout reservation-week-layout">
        <div className="reservation-edit-form">
          <label>
            <span className="field-head">
              <span className="field-title">Solicitud asociada</span>
            </span>
            <input value={reservation.request?.title ?? "Sin solicitud"} disabled />
          </label>

          <label>
            <span className="field-head">
              <span className="field-title">Proyecto asociado</span>
            </span>
            <input value={reservation.project?.name ?? reservation.title} disabled />
          </label>

          <label>
            <span className="field-head">
              <span className="field-title">Maquina asignada</span>
            </span>
            <input value={reservation.machine.name} disabled />
          </label>

          <div className="reservation-block-hints">
            <span>Min bloques: {rules?.minBlocks ?? 1}</span>
            <span>Max bloques: {rules?.maxBlocks ?? 8}</span>
            <span>Bloques actuales: {form.blockNumbers.length}</span>
          </div>

          <label>
            <span className="field-head">
              <span className="field-title">Fecha</span>
            </span>
            <input
              type="date"
              value={form.date}
              disabled={isLocked}
              onChange={(event) => {
                setWeekStart(event.target.value);
                setForm({ ...form, date: event.target.value, blockNumbers: [] });
              }}
            />
          </label>

          {isLocked ? <p className="reservation-warning">Esta reserva ya paso su fecha o estado operativo y no puede ser modificada.</p> : null}

          <label>
            <span className="field-head reservation-description-head">
              <span className="field-title">Descripcion</span>
              <AlertCircle size={18} strokeWidth={1.9} />
            </span>
            <textarea value={form.description} disabled={isLocked} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>

          {!isLocked ? (
            <div className="reservation-week-actions">
              <button type="button" className="projects-sort-button" onClick={applySuggestedBlocks}>
                <Sparkles size={16} />
                <span>Aplicar sugerencia</span>
              </button>
            </div>
          ) : null}

          <div className="reservation-edit-actions">
            <button type="button" className="secondary-button" onClick={() => navigate("/mis-reservas")}>
              Volver
            </button>
            {!isLocked ? (
              <button type="button" className="primary-button" disabled={saving || form.blockNumbers.length === 0} onClick={handleSave}>
                {saving ? "Guardando..." : "Actualizar"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="reservation-week-panel">
          <div className="reservation-week-nav">
            <button type="button" className="projects-page-arrow" onClick={() => setWeekStart(shiftDate(weekStart, -7))} disabled={isLocked}>
              <ChevronLeft size={18} />
            </button>
            <strong>Semana desde {weekStart}</strong>
            <button type="button" className="projects-page-arrow" onClick={() => setWeekStart(shiftDate(weekStart, 7))} disabled={isLocked}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="reservation-week-days">
            {schedule?.days.map((day) => {
              const selected = day.date === form.date;
              return (
                <button
                  key={day.date}
                  type="button"
                  className={selected ? "reservation-week-day reservation-week-day-active" : "reservation-week-day"}
                  onClick={() => !isLocked && setForm({ ...form, date: day.date, blockNumbers: [] })}
                  disabled={isLocked}
                >
                  <strong>{day.weekdayLabel}</strong>
                  <span>{day.date}</span>
                  <span>Ocupacion {day.occupancyRate}%</span>
                  <span>{day.freeBlockCount} bloques libres</span>
                </button>
              );
            })}
          </div>

          {loadingSchedule ? <p className="inline-note">Actualizando agenda semanal...</p> : null}

          {selectedDay ? (
            <>
              <div className="reservation-schedule-card">
                <div className="reservation-schedule-day">{formatDayLabel(selectedDay.date)}</div>

                <div className="reservation-schedule-grid">
                  {reservationBlocks.map((block) => {
                    const selected = form.blockNumbers.includes(block.number);
                    const reserved = selectedDay.reservedBlockNumbers.includes(block.number);
                    const maintenance = selectedDay.maintenanceBlockNumbers.includes(block.number);
                    const className = maintenance
                      ? "reservation-slot reservation-slot-maintenance"
                      : reserved
                        ? "reservation-slot reservation-slot-reserved"
                        : selected
                          ? "reservation-slot reservation-slot-selected"
                          : "reservation-slot";

                    return (
                      <button key={block.number} type="button" className={className} onClick={() => toggleBlock(block.number)} disabled={isLocked || reserved || maintenance}>
                        <strong>{block.label}</strong>
                        <span>
                          {block.hour.toString().padStart(2, "0")}:{block.minute.toString().padStart(2, "0")} - {block.endHour.toString().padStart(2, "0")}:
                          {block.endMinute.toString().padStart(2, "0")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="reservation-week-meta">
                <div className="request-machine-hint">
                  <strong>Ocupacion del dia</strong>
                  <span>Reservados: {selectedDay.reservedBlockNumbers.length} bloque(s)</span>
                  <span>Mantenimiento: {selectedDay.maintenanceBlockNumbers.length} bloque(s)</span>
                  <span>Sugerencia: {selectedDay.suggestedBlockNumbers.length > 0 ? selectedDay.suggestedBlockNumbers.join(", ") : "Sin sugerencia disponible"}</span>
                </div>

                {selectedDay.maintenanceWindows.length > 0 ? (
                  <div className="request-machine-hint request-material-warning">
                    <strong>Mantenimiento programado</strong>
                    {selectedDay.maintenanceWindows.map((window) => (
                      <span key={window.id}>{window.reason}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {message ? <p className="feedback-success">{message}</p> : null}
      {error ? <p className="feedback-error">{error}</p> : null}
    </div>
  );
}
