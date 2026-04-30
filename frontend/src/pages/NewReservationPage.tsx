import { AlertCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, Reservation, ReservationSchedule, ServiceRequestDetail } from "../lib/api";
import { reservationBlocks } from "../lib/reservationBlocks";
import { buildReservationPayload, formatDayLabel, shiftDate, toDateInputValue } from "../lib/reservationUtils";

type ReservationFormState = {
  projectId: string;
  requestId: string;
  machineId: string;
  date: string;
  description: string;
  blockNumbers: number[];
};

export function NewReservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId") ?? "";
  const [requestDetail, setRequestDetail] = useState<ServiceRequestDetail | null>(null);
  const [schedule, setSchedule] = useState<ReservationSchedule | null>(null);
  const [form, setForm] = useState<ReservationFormState | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setError("Debes ingresar desde una solicitud aprobada.");
      return;
    }

    api
      .getRequestById(requestId)
      .then((detail) => {
        const initialDate = toDateInputValue(detail.requestedDate);
        setRequestDetail(detail);
        setWeekStart(initialDate);
        setForm({
          projectId: detail.project.id,
          requestId: detail.id,
          machineId: detail.machine.id,
          date: initialDate,
          description: detail.description,
          blockNumbers: []
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [requestId]);

  useEffect(() => {
    if (!form?.machineId || !weekStart || !requestId) {
      return;
    }

    setLoadingSchedule(true);
    api
      .getReservationSchedule(form.machineId, weekStart, requestId)
      .then((nextSchedule) => {
        setSchedule(nextSchedule);
        setForm((current) => {
          if (!current) {
            return current;
          }

          const hasCurrentDay = nextSchedule.days.some((day) => day.date === current.date);
          const nextDay = hasCurrentDay ? current.date : nextSchedule.days[0]?.date ?? current.date;
          return {
            ...current,
            date: nextDay,
            blockNumbers: hasCurrentDay ? current.blockNumbers : []
          };
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingSchedule(false));
  }, [form?.machineId, requestId, weekStart]);

  const canReserve = useMemo(() => {
    if (!requestDetail) {
      return false;
    }

    return (
      requestDetail.status === "APPROVED" &&
      (requestDetail.quotationStatus === "ACCEPTED" || (requestDetail.quotationStatus === "NOT_REQUESTED" && !requestDetail.quotation))
    );
  }, [requestDetail]);

  const selectedDay = useMemo(() => schedule?.days.find((day) => day.date === form?.date) ?? null, [form?.date, schedule]);
  const rules = schedule?.machine.rules;

  function toggleBlock(blockNumber: number) {
    if (!form || !selectedDay || !rules) {
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
      setError("Esta maquina requiere bloques consecutivos. Agrega solo bloques contiguos a tu seleccion actual.");
      return;
    }

    setError(null);
    setForm({
      ...form,
      blockNumbers: [...form.blockNumbers, blockNumber].sort((left, right) => left - right)
    });
  }

  function applySuggestedBlocks() {
    if (!schedule || !form) {
      return;
    }

    const preferredDay = schedule.days.find((day) => day.date === form.date && day.suggestedBlockNumbers.length > 0) ?? schedule.days.find((day) => day.suggestedBlockNumbers.length > 0);

    if (!preferredDay) {
      setError("No hay bloques sugeridos disponibles en esta semana para la duracion estimada.");
      return;
    }

    setError(null);
    setForm({
      ...form,
      date: preferredDay.date,
      blockNumbers: preferredDay.suggestedBlockNumbers
    });
  }

  async function handleCreate() {
    if (!form || !requestDetail || !canReserve || form.blockNumbers.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const draftReservation = {
      project: requestDetail.project,
      request: {
        id: requestDetail.id,
        title: requestDetail.title,
        status: requestDetail.status,
        quotationStatus: requestDetail.quotationStatus
      },
      title: requestDetail.title,
      notes: "",
      status: "PENDING" as Reservation["status"]
    };

    try {
      const created = await api.createReservation(buildReservationPayload(form, draftReservation));
      setMessage("Reserva creada correctamente.");
      navigate(`/mis-reservas/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la reserva.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !form) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!requestDetail || !form) {
    return <div className="content-card">Cargando formulario de reserva...</div>;
  }

  if (!canReserve) {
    return (
      <div className="content-card feedback-error">
        Esta solicitud aun no puede transformarse en reserva. Debe estar aprobada y, si tiene cotizacion, debe haber sido aceptada.
      </div>
    );
  }

  return (
    <div className="portal-page reservation-edit-page reservation-create-page reservation-week-page">
      <div className="breadcrumb">Inicio &gt; reservas &gt; nueva</div>
      <h1 className="page-title">Crear reserva</h1>

      <section className="reservation-edit-layout reservation-week-layout">
        <div className="reservation-edit-form">
          <label>
            <span className="field-head">
              <span className="field-title">Solicitud aprobada</span>
            </span>
            <input value={requestDetail.title} disabled />
          </label>

          <label>
            <span className="field-head">
              <span className="field-title">Proyecto asociado</span>
            </span>
            <input value={requestDetail.project.name} disabled />
          </label>

          <label>
            <span className="field-head">
              <span className="field-title">Maquina asignada</span>
            </span>
            <input value={requestDetail.machine.name} disabled />
          </label>

          <div className="reservation-block-hints">
            <span>Min bloques: {rules?.minBlocks ?? 1}</span>
            <span>Max bloques: {rules?.maxBlocks ?? 8}</span>
            <span>Duracion sugerida: {schedule?.recommendedBlockCount ?? 1} bloque(s)</span>
          </div>

          <label>
            <span className="field-head">
              <span className="field-title">Fecha seleccionada</span>
            </span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => {
                setWeekStart(event.target.value);
                setForm({ ...form, date: event.target.value, blockNumbers: [] });
              }}
            />
          </label>

          <label>
            <span className="field-head reservation-description-head">
              <span className="field-title">Descripcion</span>
              <AlertCircle size={18} strokeWidth={1.9} />
            </span>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>

          <div className="reservation-week-actions">
            <button type="button" className="projects-sort-button" onClick={applySuggestedBlocks}>
              <Sparkles size={16} />
              <span>Aplicar sugerencia</span>
            </button>
          </div>

          <div className="reservation-edit-actions">
            <button type="button" className="secondary-button" onClick={() => navigate(`/mis-solicitudes/${requestDetail.id}`)}>
              Cancelar
            </button>
            <button type="button" className="primary-button" disabled={saving || form.blockNumbers.length === 0} onClick={handleCreate}>
              {saving ? "Reservando..." : "Reservar"}
            </button>
          </div>
        </div>

        <div className="reservation-week-panel">
          <div className="reservation-week-nav">
            <button type="button" className="projects-page-arrow" onClick={() => setWeekStart(shiftDate(weekStart, -7))}>
              <ChevronLeft size={18} />
            </button>
            <strong>Semana desde {weekStart}</strong>
            <button type="button" className="projects-page-arrow" onClick={() => setWeekStart(shiftDate(weekStart, 7))}>
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
                  onClick={() => setForm({ ...form, date: day.date, blockNumbers: [] })}
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
                      <button key={block.number} type="button" className={className} onClick={() => toggleBlock(block.number)} disabled={reserved || maintenance}>
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
                  <strong>Bloqueos del dia</strong>
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
