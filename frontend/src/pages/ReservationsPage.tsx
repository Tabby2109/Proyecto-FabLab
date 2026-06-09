import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Reservation } from "../lib/api";

type SortField = "project" | "machine" | "startAt" | "createdAt" | "status";
type SortDirection = "asc" | "desc";

const pageSize = 5;

function formatReservationDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-CL");
}

function formatReservationCreated(dateValue: string) {
  return new Date(dateValue).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatReservationStatus(status: Reservation["status"]) {
  const labels: Record<Reservation["status"], string> = {
    PENDING: "Creada",
    CONFIRMED: "Confirmada",
    CANCELLED: "Anulada",
    COMPLETED: "Completada"
  };

  return labels[status];
}

function getReservationBadgeClass(status: Reservation["status"]) {
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

export function ReservationsPage() {
  const navigate = useNavigate();
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getReservations()
      .then(setReservations)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredReservations = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    const filtered = lowered
      ? reservations.filter((reservation) =>
          [
            reservation.project?.name ?? reservation.title,
            reservation.machine.name,
            formatReservationStatus(reservation.status),
            formatReservationDate(reservation.startAt)
          ].some((value) => value.toLowerCase().includes(lowered))
        )
      : reservations;

    return [...filtered].sort((left, right) => {
      const leftValue =
        sortField === "project"
          ? left.project?.name ?? left.title
          : sortField === "machine"
            ? left.machine.name
            : sortField === "status"
              ? formatReservationStatus(left.status)
              : left[sortField];
      const rightValue =
        sortField === "project"
          ? right.project?.name ?? right.title
          : sortField === "machine"
            ? right.machine.name
            : sortField === "status"
              ? formatReservationStatus(right.status)
              : right[sortField];

      if (sortField === "startAt" || sortField === "createdAt") {
        const leftDate = new Date(String(leftValue)).getTime();
        const rightDate = new Date(String(rightValue)).getTime();
        return sortDirection === "asc" ? leftDate - rightDate : rightDate - leftDate;
      }

      const result = String(leftValue).localeCompare(String(rightValue), "es", { numeric: true });
      return sortDirection === "asc" ? result : -result;
    });
  }, [reservations, searchTerm, sortDirection, sortField]);

  const visibleReservations = filteredReservations.slice(0, pageSize);

  return (
    <div className="portal-page reservations-page">
      <div className="breadcrumb">Inicio &gt; mis_reservas</div>
      <h1 className="page-title">Reservas</h1>

      <section className="projects-toolbar">
        <div className="projects-search">
          <Search size={22} strokeWidth={1.9} />
          <input placeholder="Buscar" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>

        <div className="projects-actions">
          <button type="button" className="projects-create-button" onClick={() => navigate("/mis-reservas/nueva")}>
            <Plus size={18} />
            <span>Crear</span>
          </button>

          <div className="projects-sort" ref={sortMenuRef}>
            <button type="button" className="projects-sort-button" onClick={() => setSortMenuOpen((value) => !value)}>
              <span>Ordenar</span>
              <SlidersHorizontal size={16} />
            </button>

            {sortMenuOpen ? (
              <div className="projects-sort-menu">
                <div className="projects-sort-head">
                  <strong>Ordenar por</strong>
                  <button type="button" className="projects-sort-close" onClick={() => setSortMenuOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <button
                  type="button"
                  className={sortField === "project" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"}
                  onClick={() => setSortField("project")}
                >
                  Proyecto
                </button>
                <button
                  type="button"
                  className={sortField === "machine" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"}
                  onClick={() => setSortField("machine")}
                >
                  Maquina
                </button>
                <button
                  type="button"
                  className={sortField === "startAt" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"}
                  onClick={() => setSortField("startAt")}
                >
                  Fecha de reserva
                </button>
                <button
                  type="button"
                  className={sortField === "createdAt" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"}
                  onClick={() => setSortField("createdAt")}
                >
                  Fecha de creacion
                </button>
                <button
                  type="button"
                  className={sortField === "status" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"}
                  onClick={() => setSortField("status")}
                >
                  Estado
                </button>

                <div className="projects-sort-direction">
                  <button
                    type="button"
                    className={sortDirection === "asc" ? "projects-direction-button projects-direction-button-active" : "projects-direction-button"}
                    onClick={() => setSortDirection("asc")}
                  >
                    <ArrowUp size={16} />
                    <span>Ascendente</span>
                  </button>

                  <button
                    type="button"
                    className={sortDirection === "desc" ? "projects-direction-button projects-direction-button-active" : "projects-direction-button"}
                    onClick={() => setSortDirection("desc")}
                  >
                    <ArrowDown size={16} />
                    <span>Descendente</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="projects-table-wrap">
        <table className="projects-table reservations-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Maquina</th>
              <th>Fecha de reserva</th>
              <th>Fecha creacion</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {visibleReservations.length > 0 ? (
              visibleReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.project?.name ?? reservation.title}</td>
                  <td>{reservation.machine.name}</td>
                  <td>{formatReservationDate(reservation.startAt)}</td>
                  <td>{formatReservationCreated(reservation.createdAt)}</td>
                  <td>
                    <span className={getReservationBadgeClass(reservation.status)}>{formatReservationStatus(reservation.status)}</span>
                  </td>
                  <td>
                    <button type="button" className="reservation-edit-button" onClick={() => navigate(`/mis-reservas/${reservation.id}`)}>
                      <Pencil size={15} />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="projects-empty-cell">
                  No se han encontrado elementos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="projects-footer">
        <button type="button" className="secondary-button" onClick={() => navigate("/")}>
          Volver
        </button>

        <div className="projects-pagination">
          <span>Elementos por pagina:</span>
          <button type="button" className="projects-page-size">
            <span>{pageSize}</span>
            <ChevronDown size={16} />
          </button>
          <span>
            {visibleReservations.length > 0 ? 1 : 0} de {filteredReservations.length}
          </span>
          <button type="button" className="projects-page-arrow" disabled>
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="projects-page-arrow" disabled>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error ? <p className="feedback-error">{error}</p> : null}
    </div>
  );
}
