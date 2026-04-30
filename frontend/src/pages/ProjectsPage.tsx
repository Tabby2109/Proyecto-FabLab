import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, UploadCloud, X } from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, CreateProjectPayload, Project } from "../lib/api";
import { formatProjectStatus } from "../lib/statusUtils";

type SortField = "id" | "name" | "createdAt" | "finishedAt";
type SortDirection = "asc" | "desc";

type ProjectFormState = {
  name: string;
  description: string;
  repositoryUrl: string;
  courseName: string;
  professorName: string;
  academicPeriod: string;
  projectType: Project["projectType"] | "";
  scope: Project["scope"];
  attachmentNames: string[];
};

const pageSize = 5;

const projectTypeOptions: Array<{ value: Project["projectType"]; label: string }> = [
  { value: "PRINT_3D", label: "Impresion 3D" },
  { value: "LASER_CUT", label: "Corte laser" },
  { value: "CNC", label: "CNC" },
  { value: "ELECTRONICS", label: "Electronica" },
  { value: "PROTOTYPE", label: "Prototipo" },
  { value: "OTHER", label: "Otro" }
];

const initialForm: ProjectFormState = {
  name: "",
  description: "",
  repositoryUrl: "",
  courseName: "INF322 - Diseno de Interfaces Usuarias",
  professorName: "",
  academicPeriod: "2026-1",
  projectType: "",
  scope: "INDIVIDUAL",
  attachmentNames: []
};

function formatProjectType(projectType: Project["projectType"]) {
  return projectTypeOptions.find((option) => option.value === projectType)?.label ?? "Otro";
}

function formatProjectDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-CL");
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProjects()
      .then(setProjects)
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

  const filteredProjects = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    const filtered = lowered
      ? projects.filter((project) =>
          [project.name, project.description, formatProjectType(project.projectType)].some((value) => value.toLowerCase().includes(lowered))
        )
      : projects;

    return [...filtered].sort((left, right) => {
      const leftValue = left[sortField] ?? "";
      const rightValue = right[sortField] ?? "";

      if (sortField === "createdAt" || sortField === "finishedAt") {
        const leftDate = leftValue ? new Date(String(leftValue)).getTime() : 0;
        const rightDate = rightValue ? new Date(String(rightValue)).getTime() : 0;
        return sortDirection === "asc" ? leftDate - rightDate : rightDate - leftDate;
      }

      const result = String(leftValue).localeCompare(String(rightValue), "es", { numeric: true });
      return sortDirection === "asc" ? result : -result;
    });
  }, [projects, searchTerm, sortDirection, sortField]);

  const visibleProjects = filteredProjects.slice(0, pageSize);
  const canCreate = form.name.trim().length >= 3 && form.description.trim().length >= 10 && form.projectType !== "";

  function resetForm() {
    setForm(initialForm);
    setError(null);
    setMessage(null);
  }

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const fileNames = Array.from(files)
      .slice(0, 3)
      .map((file) => file.name);

    setForm((current) => ({
      ...current,
      attachmentNames: fileNames
    }));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
  }

  async function handleCreateProject() {
    if (!canCreate) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const payload: CreateProjectPayload = {
        name: form.name,
        description: form.description,
        repositoryUrl: form.repositoryUrl,
        courseName: form.courseName,
        professorName: form.professorName,
        academicPeriod: form.academicPeriod,
        projectType: form.projectType as Project["projectType"],
        scope: form.scope,
        attachmentNames: form.attachmentNames
      };

      const created = await api.createProject(payload);
      setProjects((current) => [created, ...current]);
      setMessage("Proyecto creado correctamente.");
      setModalOpen(false);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proyecto.");
    }
  }

  return (
    <div className="portal-page projects-page">
      <div className="breadcrumb">Inicio &gt; proyectos</div>
      <h1 className="page-title">Proyectos</h1>

      <section className="projects-toolbar">
        <div className="projects-search">
          <Search size={22} strokeWidth={1.9} />
          <input placeholder="Buscar" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>

        <div className="projects-actions">
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

                <button type="button" className={sortField === "id" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"} onClick={() => setSortField("id")}>
                  ID
                </button>
                <button type="button" className={sortField === "name" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"} onClick={() => setSortField("name")}>
                  Nombre
                </button>
                <button
                  type="button"
                  className={sortField === "createdAt" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"}
                  onClick={() => setSortField("createdAt")}
                >
                  Fecha de Creacion
                </button>
                <button
                  type="button"
                  className={sortField === "finishedAt" ? "projects-sort-option projects-sort-option-active" : "projects-sort-option"}
                  onClick={() => setSortField("finishedAt")}
                >
                  Fecha de Finalizacion
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

          <button
            type="button"
            className="projects-create-button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Crear</span>
          </button>
        </div>
      </section>

      <section className="projects-table-wrap">
        <table className="projects-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Tipo de proyecto</th>
              <th>Fecha de creacion</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {visibleProjects.length > 0 ? (
              visibleProjects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{formatProjectStatus(project.status)}</td>
                  <td>{formatProjectType(project.projectType)}</td>
                  <td>{formatProjectDate(project.createdAt)}</td>
                  <td>
                    <button type="button" className="projects-row-action" onClick={() => navigate(`/mis-proyectos/${project.id}`)}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="projects-empty-cell">
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
            {visibleProjects.length > 0 ? 1 : 0} de {filteredProjects.length}
          </span>
          <button type="button" className="projects-page-arrow" disabled>
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="projects-page-arrow" disabled>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {message ? <p className="feedback-success">{message}</p> : null}
      {error ? <p className="feedback-error">{error}</p> : null}

      {modalOpen ? (
        <div className="projects-modal-backdrop">
          <div className="projects-modal">
            <div className="breadcrumb">Inicio &gt; proyectos &gt; crear</div>
            <h2 className="projects-modal-title">Crear proyecto</h2>

            <div className="projects-form">
              <label className="field-span-2">
                <span className="field-head">
                  <span className="field-title">Nombre</span>
                </span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>

              <label className="field-span-2">
                <span className="field-head">
                  <span className="field-title">Descripcion</span>
                </span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>

              <label className="field-span-2">
                <span className="field-head">
                  <span className="field-title">Link Repositorio (opcional)</span>
                </span>
                <input value={form.repositoryUrl} onChange={(event) => setForm({ ...form, repositoryUrl: event.target.value })} />
              </label>

              <label>
                <span className="field-head">
                  <span className="field-title">Curso</span>
                </span>
                <input value={form.courseName} onChange={(event) => setForm({ ...form, courseName: event.target.value })} />
              </label>

              <label>
                <span className="field-head">
                  <span className="field-title">Docente</span>
                </span>
                <input value={form.professorName} onChange={(event) => setForm({ ...form, professorName: event.target.value })} />
              </label>

              <label className="field-span-2">
                <span className="field-head">
                  <span className="field-title">Periodo academico</span>
                </span>
                <input value={form.academicPeriod} onChange={(event) => setForm({ ...form, academicPeriod: event.target.value })} />
              </label>

              <label className="field-span-2">
                <span className="field-head">
                  <span className="field-title">Selecciona el tipo de proyecto</span>
                </span>
                <select value={form.projectType} onChange={(event) => setForm({ ...form, projectType: event.target.value as ProjectFormState["projectType"] })}>
                  <option value="">Selecciona el tipo de proyecto</option>
                  {projectTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field-span-2 projects-radio-block">
                <span className="projects-radio-title">Selecciona si el proyecto es grupal o individual</span>
                <label className="projects-radio-option">
                  <input type="radio" checked={form.scope === "INDIVIDUAL"} onChange={() => setForm({ ...form, scope: "INDIVIDUAL" })} />
                  <span>Individual</span>
                </label>
                <label className="projects-radio-option">
                  <input type="radio" checked={form.scope === "GROUP"} onChange={() => setForm({ ...form, scope: "GROUP" })} />
                  <span>Grupal</span>
                </label>
              </div>

              <div className="field-span-2">
                <span className="projects-upload-title">Subir archivos</span>
                <div
                  className="projects-upload-box"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={34} strokeWidth={1.7} />
                  <p>
                    Arrastre sus archivos aqui, o haga click para buscar sus archivos
                    <br />
                    (Maximo 3 en total)
                  </p>
                  {form.attachmentNames.length > 0 ? <span className="projects-upload-files">{form.attachmentNames.join(", ")}</span> : null}
                </div>

                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />
              </div>
            </div>

            <div className="projects-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button type="button" className="primary-button" onClick={handleCreateProject} disabled={!canCreate}>
                Crear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
