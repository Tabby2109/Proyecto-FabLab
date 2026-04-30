import { FormEvent, useEffect, useState } from "react";
import { api, AdminMachinePayload, Machine, MachineType } from "../lib/api";

const initialForm: AdminMachinePayload = {
  name: "",
  slug: "",
  description: "",
  category: "PRINT_3D",
  status: "AVAILABLE",
  hourlyRate: 0,
  setupMinutes: 15,
  maxDurationMinutes: 120,
  supportedFormats: ["stl"],
  location: "",
  minBlocks: 1,
  maxBlocks: 4,
  machineTypeId: null
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminMachinePayload>(initialForm);
  const [formatsInput, setFormatsInput] = useState("stl");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    const [machinesData, machineTypesData] = await Promise.all([api.getAdminMachines(), api.getAdminMachineTypes()]);
    setMachines(machinesData);
    setMachineTypes(machineTypesData);
  }

  useEffect(() => {
    loadData().catch((err: Error) => setError(err.message));
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(initialForm);
    setFormatsInput("stl");
  }

  function startEdit(machine: Machine) {
    setEditingId(machine.id);
    setForm({
      name: machine.name,
      slug: machine.slug,
      description: machine.description,
      category: machine.category as AdminMachinePayload["category"],
      status: machine.status as AdminMachinePayload["status"],
      hourlyRate: Number(machine.hourlyRate),
      setupMinutes: machine.setupMinutes,
      maxDurationMinutes: machine.maxDurationMinutes,
      supportedFormats: machine.supportedFormats,
      location: machine.location ?? "",
      minBlocks: machine.minBlocks ?? 1,
      maxBlocks: machine.maxBlocks ?? 4,
      machineTypeId: machine.machineTypeId ?? null
    });
    setFormatsInput(machine.supportedFormats.join(", "));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        supportedFormats: formatsInput.split(",").map((item) => item.trim()).filter(Boolean)
      };

      if (editingId) {
        await api.updateAdminMachine(editingId, payload);
        setMessage("Maquina actualizada.");
      } else {
        await api.createAdminMachine(payload);
        setMessage("Maquina creada.");
      }

      await loadData();
      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la maquina.");
    }
  }

  return (
    <div className="portal-page admin-machines-page">
      <div className="breadcrumb">Inicio &gt; admin &gt; maquinas</div>
      <h1 className="page-title">Admin Maquinas</h1>

      <section className="admin-machines-layout">
        <article className="content-card">
          <div className="admin-machines-head">
            <h2>{editingId ? "Editar maquina" : "Nueva maquina"}</h2>
            <button type="button" className="machine-card-button" onClick={startCreate}>
              Nuevo
            </button>
          </div>

          <form className="admin-machines-form" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: editingId ? form.slug : slugify(event.target.value) })} required />
            </label>
            <label>
              Slug
              <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
            </label>
            <label>
              Tipo de maquina
              <select value={form.machineTypeId ?? ""} onChange={(event) => setForm({ ...form, machineTypeId: event.target.value || null })}>
                <option value="">Sin tipo</option>
                {machineTypes.map((machineType) => (
                  <option key={machineType.id} value={machineType.id}>
                    {machineType.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Categoria
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as AdminMachinePayload["category"] })}>
                <option value="PRINT_3D">Impresion 3D</option>
                <option value="LASER">Laser</option>
                <option value="CNC">CNC</option>
                <option value="ELECTRONICS">Electronica</option>
                <option value="VINYL">Vinilo</option>
              </select>
            </label>
            <label className="field-span-2">
              Descripcion
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </label>
            <label>
              Estado
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AdminMachinePayload["status"] })}>
                <option value="AVAILABLE">Disponible</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="OFFLINE">Fuera de linea</option>
              </select>
            </label>
            <label>
              Ubicacion
              <input value={form.location ?? ""} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </label>
            <label>
              Tarifa por hora
              <input type="number" min="0" value={form.hourlyRate} onChange={(event) => setForm({ ...form, hourlyRate: Number(event.target.value) })} required />
            </label>
            <label>
              Minutos de setup
              <input type="number" min="0" value={form.setupMinutes} onChange={(event) => setForm({ ...form, setupMinutes: Number(event.target.value) })} required />
            </label>
            <label>
              Duracion maxima
              <input type="number" min="35" value={form.maxDurationMinutes} onChange={(event) => setForm({ ...form, maxDurationMinutes: Number(event.target.value) })} required />
            </label>
            <label>
              Min bloques
              <input type="number" min="1" max="18" value={form.minBlocks ?? 1} onChange={(event) => setForm({ ...form, minBlocks: Number(event.target.value) })} />
            </label>
            <label>
              Max bloques
              <input type="number" min="1" max="18" value={form.maxBlocks ?? 4} onChange={(event) => setForm({ ...form, maxBlocks: Number(event.target.value) })} />
            </label>
            <label className="field-span-2">
              Formatos soportados
              <input value={formatsInput} onChange={(event) => setFormatsInput(event.target.value)} placeholder="stl, obj, 3mf" />
            </label>
            <div className="account-actions">
              <button type="submit" className="primary-button">
                {editingId ? "Guardar cambios" : "Crear maquina"}
              </button>
            </div>
          </form>
        </article>

        <article className="content-card">
          <h2>Maquinas registradas</h2>
          <div className="admin-machine-list">
            {machines.map((machine) => (
              <button key={machine.id} type="button" className="admin-machine-item" onClick={() => startEdit(machine)}>
                <div>
                  <strong>{machine.name}</strong>
                  <span>{machine.machineType?.name ?? "Sin tipo"}</span>
                </div>
                <div>
                  <span>{machine.status}</span>
                </div>
              </button>
            ))}
          </div>
        </article>
      </section>

      {message ? <p className="feedback-success">{message}</p> : null}
      {error ? <p className="feedback-error">{error}</p> : null}
    </div>
  );
}
