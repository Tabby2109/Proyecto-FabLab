import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, FileUp, Info } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, Machine, Material, Project } from "../lib/api";
import { REQUEST_ALLOWED_EXTENSIONS, REQUEST_MAX_FILE_COUNT, REQUEST_MAX_FILE_SIZE_BYTES, formatFileSize, hasValidRequestExtension } from "../lib/requestFiles";

const initialForm = {
  projectId: "",
  machineId: "",
  materialId: "",
  title: "",
  description: "",
  notes: "",
  requestedDate: "",
  estimatedDurationMinutes: "60",
  quantity: "1",
  materialUnitsRequested: "1"
};

type ChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

export function NewRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.getProjects(), api.getMachines(), api.getMaterials()])
      .then(([projectsData, machinesData, materialsData]) => {
        setProjects(projectsData);
        setMachines(machinesData);
        setMaterials(materialsData);

        const queryProjectId = searchParams.get("projectId");
        if (queryProjectId) {
          setForm((current) => ({
            ...current,
            projectId: queryProjectId
          }));
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const selectedMachine = useMemo(() => machines.find((machine) => machine.id === form.machineId) ?? null, [machines, form.machineId]);
  const selectedMaterial = useMemo(() => materials.find((material) => material.id === form.materialId) ?? null, [materials, form.materialId]);
  const requestedMaterialUnits = Number(form.materialUnitsRequested || 0);
  const exceedsMaterialAvailability = selectedMaterial ? requestedMaterialUnits > selectedMaterial.availableQuantity : false;

  const checklist = useMemo<ChecklistItem[]>(
    () => [
      { id: "project", label: "Proyecto asociado seleccionado", complete: Boolean(form.projectId) },
      { id: "title", label: "Titulo tecnico definido", complete: form.title.trim().length >= 5 },
      { id: "machine", label: "Maquina sugerida seleccionada", complete: Boolean(form.machineId) },
      { id: "material", label: "Material deseado seleccionado", complete: Boolean(form.materialId) },
      { id: "quantity", label: "Cantidad valida", complete: Number(form.quantity) > 0 },
      { id: "material-units", label: "Consumo estimado de material definido", complete: Number(form.materialUnitsRequested) > 0 },
      { id: "due-date", label: "Plazo solicitado definido", complete: Boolean(form.requestedDate) },
      { id: "description", label: "Descripcion tecnica suficiente", complete: form.description.trim().length >= 20 },
      { id: "files", label: "Al menos un archivo tecnico adjunto", complete: files.length > 0 }
    ],
    [files.length, form.description, form.machineId, form.materialId, form.materialUnitsRequested, form.projectId, form.quantity, form.requestedDate, form.title]
  );

  const checklistComplete = checklist.every((item) => item.complete);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const inputFiles = Array.from(event.target.files ?? []);
    const nextFiles = [...files, ...inputFiles];

    if (nextFiles.length > REQUEST_MAX_FILE_COUNT) {
      setError(`Solo puedes adjuntar hasta ${REQUEST_MAX_FILE_COUNT} archivos por solicitud.`);
      event.target.value = "";
      return;
    }

    const invalidFile = inputFiles.find((file) => !hasValidRequestExtension(file.name) || file.size > REQUEST_MAX_FILE_SIZE_BYTES);
    if (invalidFile) {
      setError(
        !hasValidRequestExtension(invalidFile.name)
          ? `Formato no permitido en ${invalidFile.name}. Usa ${REQUEST_ALLOWED_EXTENSIONS.join(", ")}.`
          : `${invalidFile.name} supera el tamano maximo permitido de 10 MB.`
      );
      event.target.value = "";
      return;
    }

    setFiles(nextFiles);
    setError(null);
    event.target.value = "";
  }

  function removeFile(fileName: string) {
    setFiles((current) => current.filter((file) => `${file.name}-${file.size}` !== fileName));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!checklistComplete) {
      setError("Completa el checklist tecnico antes de enviar la solicitud.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await api.createRequest({
        ...form,
        estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
        quantity: Number(form.quantity),
        materialUnitsRequested: Number(form.materialUnitsRequested),
        files
      });

      setMessage("Solicitud registrada correctamente.");
      navigate(`/mis-solicitudes/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="content-card">Cargando formulario de solicitud...</div>;
  }

  return (
    <div className="portal-page request-create-page">
      <div className="breadcrumb">Inicio &gt; solicitudes &gt; nueva</div>
      <h1 className="page-title">Nueva solicitud</h1>

      <div className="request-create-layout">
        <article className="content-card request-create-card">
          <form className="request-form" onSubmit={handleSubmit}>
            <label className="field-span-2">
              <span className="field-head">
                <span className="field-title">Proyecto asociado</span>
                <span className="required">*</span>
              </span>
              <select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} required>
                <option value="">Selecciona un proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-span-2">
              <span className="field-head">
                <span className="field-title">Titulo de la solicitud</span>
                <span className="required">*</span>
              </span>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Maquina sugerida</span>
                <span className="required">*</span>
              </span>
              <select value={form.machineId} onChange={(event) => setForm({ ...form, machineId: event.target.value })} required>
                <option value="">Selecciona una maquina</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Material deseado</span>
                <span className="required">*</span>
              </span>
              <select value={form.materialId} onChange={(event) => setForm({ ...form, materialId: event.target.value })} required>
                <option value="">Selecciona un material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Cantidad</span>
                <span className="required">*</span>
              </span>
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Consumo estimado de material</span>
                <span className="required">*</span>
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.materialUnitsRequested}
                onChange={(event) => setForm({ ...form, materialUnitsRequested: event.target.value })}
                required
              />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Plazo solicitado</span>
                <span className="required">*</span>
              </span>
              <input type="date" value={form.requestedDate} onChange={(event) => setForm({ ...form, requestedDate: event.target.value })} required />
            </label>

            <label>
              <span className="field-head">
                <span className="field-title">Tiempo estimado de uso (min)</span>
              </span>
              <input
                type="number"
                min="1"
                value={form.estimatedDurationMinutes}
                onChange={(event) => setForm({ ...form, estimatedDurationMinutes: event.target.value })}
                required
              />
            </label>

            <div className="request-machine-hint">
              <strong>Formatos compatibles</strong>
              <span>{selectedMachine ? selectedMachine.supportedFormats.join(", ").toUpperCase() : "Selecciona una maquina para ver formatos sugeridos."}</span>
            </div>

            <div className={selectedMaterial?.lowStock || exceedsMaterialAvailability ? "request-machine-hint request-material-warning" : "request-machine-hint"}>
              <strong>Disponibilidad de material</strong>
              <span>
                {selectedMaterial
                  ? `${selectedMaterial.availableQuantity.toFixed(2)} ${selectedMaterial.unit} disponibles de ${selectedMaterial.stockQuantity.toFixed(2)} ${selectedMaterial.unit}.`
                  : "Selecciona un material para revisar stock y disponibilidad proyectada."}
              </span>
              {selectedMaterial && requestedMaterialUnits > 0 ? (
                <span className="request-warning-copy">
                  Tu solicitud proyecta {requestedMaterialUnits.toFixed(2)} {selectedMaterial.unit} de consumo.
                </span>
              ) : null}
              {selectedMaterial?.lowStock ? (
                <span className="request-warning-copy">
                  Stock bajo: el equipo FabLab podria sugerir un material alternativo o ajustar el plazo si la solicitud supera la disponibilidad actual.
                </span>
              ) : null}
              {exceedsMaterialAvailability ? (
                <span className="request-warning-copy">La cantidad estimada supera la disponibilidad actual y requerira reposicion o cambio de material.</span>
              ) : null}
            </div>

            <label className="field-span-2">
              <span className="field-head">
                <span className="field-title">Descripcion tecnica</span>
                <span className="required">*</span>
              </span>
              <textarea rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </label>

            <label className="field-span-2">
              <span className="field-head">
                <span className="field-title">Notas para el equipo FabLab</span>
              </span>
              <textarea rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>

            <div className="field-span-2 request-upload-block">
              <div className="field-head">
                <span className="field-title">Archivos tecnicos</span>
                <span className="required">*</span>
              </div>

              <label className="request-upload-dropzone">
                <input type="file" multiple accept={REQUEST_ALLOWED_EXTENSIONS.join(",")} onChange={handleFilesChange} />
                <FileUp size={24} />
                <strong>Adjunta tus archivos tecnicos</strong>
                <span>
                  Hasta {REQUEST_MAX_FILE_COUNT} archivos. Formatos: {REQUEST_ALLOWED_EXTENSIONS.join(", ")}. Maximo {formatFileSize(REQUEST_MAX_FILE_SIZE_BYTES)} por
                  archivo.
                </span>
              </label>

              {files.length > 0 ? (
                <div className="request-file-list">
                  {files.map((file) => {
                    const fileKey = `${file.name}-${file.size}`;

                    return (
                      <div key={fileKey} className="request-file-item">
                        <div>
                          <strong>{file.name}</strong>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                        <button type="button" className="projects-row-action" onClick={() => removeFile(fileKey)}>
                          Quitar
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="account-actions">
              <button type="button" className="secondary-button" onClick={() => navigate(form.projectId ? `/mis-proyectos/${form.projectId}` : "/mis-proyectos")}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={submitting || !checklistComplete}>
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </form>

          {message ? <p className="feedback-success">{message}</p> : null}
          {error ? <p className="feedback-error">{error}</p> : null}
        </article>

        <aside className="content-card request-checklist-card">
          <div className="project-detail-card-head">
            <CheckCircle2 size={18} />
            <h2>Checklist de completitud</h2>
          </div>

          <div className="request-checklist">
            {checklist.map((item) => (
              <div key={item.id} className={item.complete ? "request-checklist-item request-checklist-item-complete" : "request-checklist-item"}>
                {item.complete ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="request-checklist-note">
            <Info size={16} />
            <p>La solicitud se envía a revisión cuando el proyecto, la información técnica y los archivos están completos.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
