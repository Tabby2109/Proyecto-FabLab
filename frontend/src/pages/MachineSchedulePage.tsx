import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Machine, ReservationSchedule } from "../lib/api";
import { getWeekDates, shiftDate } from "../lib/reservationUtils";

function toDateInputValue(dateValue: Date) {
  return dateValue.toISOString().slice(0, 10);
}

export function MachineSchedulePage() {
  const { machineId = "" } = useParams();
  const navigate = useNavigate();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [schedule, setSchedule] = useState<ReservationSchedule | null>(null);
  const [weekStart, setWeekStart] = useState(toDateInputValue(new Date()));
  const [error, setError] = useState<string | null>(null);

  const currentMachine = useMemo(() => machines.find((item) => item.id === machineId) ?? null, [machineId, machines]);

  useEffect(() => {
    api.getMachines().then(setMachines).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!machineId) {
      return;
    }

    api
      .getMachineSchedule(machineId, weekStart)
      .then(setSchedule)
      .catch((err: Error) => setError(err.message));
  }, [machineId, weekStart]);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  return (
    <div className="portal-page reservation-week-page">
      <div className="breadcrumb">Inicio &gt; maquinas &gt; agenda</div>
      <div className="project-detail-head">
        <div>
          <h1 className="page-title project-detail-title">Agenda semanal de maquina</h1>
          <p className="project-detail-subtitle">{currentMachine?.name ?? "Cargando maquina..."}</p>
        </div>
        <div className="project-detail-actions">
          <button type="button" className="secondary-button" onClick={() => navigate("/maquinas")}>
            Volver
          </button>
        </div>
      </div>

      <article className="content-card reservation-week-panel">
        <div className="reservation-week-nav">
          <button type="button" className="secondary-button" onClick={() => setWeekStart(shiftDate(weekStart, -7))}>
            Semana anterior
          </button>
          <strong>{getWeekDates(weekStart)[0]} al {getWeekDates(weekStart)[6]}</strong>
          <button type="button" className="secondary-button" onClick={() => setWeekStart(shiftDate(weekStart, 7))}>
            Semana siguiente
          </button>
        </div>

        <div className="reservation-week-days">
          {schedule?.days.map((day) => (
            <article key={day.date} className="reservation-week-day">
              <strong>{day.weekdayLabel}</strong>
              <span>{day.date}</span>
              <span>Ocupacion {Math.round(day.occupancyRate * 100)}%</span>
              <span>Libres {day.freeBlockCount}</span>
              {day.maintenanceWindows.length > 0 ? <span>{day.maintenanceWindows.length} mantenciones</span> : null}
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}
