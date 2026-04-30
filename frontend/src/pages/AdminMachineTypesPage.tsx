import { FormEvent, useEffect, useState } from "react";
import { api, MachineType, MachineTypePayload } from "../lib/api";

const initialForm: MachineTypePayload = {
  name: "",
  slug: "",
  summary: "",
  description: "",
  assetName: "",
  assetPath: "",
  isPublished: true,
  minReservationBlocks: 1,
  maxReservationBlocks: 8,
  reservationRequiresConsecutive: true
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminMachineTypesPage() {
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MachineTypePayload>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadMachineTypes() {
    const data = await api.getAdminMachineTypes();
    setMachineTypes(data);
  }

  useEffect(() => {
    loadMachineTypes().catch((err: Error) => setError(err.message));
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(initialForm);
    setError(null);
    setMessage(null);
  }

  function startEdit(machineType: MachineType) {
    setEditingId(machineType.id);
    setForm({
      name: machineType.name,
      slug: machineType.slug,
      summary: machineType.summary,
      description: machineType.description,
      assetName: machineType.assetName,
      assetPath: machineType.assetPath,
      isPublished: machineType.isPublished,
      minReservationBlocks: machineType.minReservationBlocks,
      maxReservationBlocks: machineType.maxReservationBlocks,
      reservationRequiresConsecutive: machineType.reservationRequiresConsecutive
    });
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name)
      };

      if (editingId) {
        await api.updateMachineType(editingId, payload);
        setMessage("Tipo de maquina actualizado.");
      } else {
        await api.createMachineType(payload);
        setMessage("Tipo de maquina creado.");
      }

      await loadMachineTypes();
      setEditingId(null);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el tipo de maquina.");
    }
  }

  return (
    <div className="portal-page admin-machines-page">
      <div className="breadcrumb">Inicio &gt; admin &gt; tipos de maquina</div>
      <h1 className="page-title">Admin Tipos de Maquina</h1>

      <section className="admin-machines-layout">
        <article className="content-card">
          <div className="admin-machines-head">
            <h2>{editingId ? "Editar tipo de maquina" : "Nuevo tipo de maquina"}</h2>
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
              Resumen
              <input value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} required />
            </label>
            <label className="field-span-2">
              Descripcion
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </label>
            <label>
              Nombre archivo
              <input value={form.assetName} onChange={(event) => setForm({ ...form, assetName: event.target.value })} required />
            </label>
            <label>
              Ruta archivo
              <input value={form.assetPath} onChange={(event) => setForm({ ...form, assetPath: event.target.value })} required />
            </label>
            <label>
              Minimo de bloques
              <input
                type="number"
                min="1"
                max="18"
                value={form.minReservationBlocks}
                onChange={(event) => setForm({ ...form, minReservationBlocks: Number(event.target.value) })}
                required
              />
            </label>
            <label>
              Maximo de bloques
              <input
                type="number"
                min="1"
                max="18"
                value={form.maxReservationBlocks}
                onChange={(event) => setForm({ ...form, maxReservationBlocks: Number(event.target.value) })}
                required
              />
            </label>
            <label className="admin-machines-checkbox">
              <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
              <span>Publicado para usuarios normales</span>
            </label>
            <label className="admin-machines-checkbox">
              <input
                type="checkbox"
                checked={form.reservationRequiresConsecutive}
                onChange={(event) => setForm({ ...form, reservationRequiresConsecutive: event.target.checked })}
              />
              <span>Reservas deben usar bloques consecutivos</span>
            </label>

            <div className="account-actions">
              <button type="submit" className="primary-button">
                {editingId ? "Guardar cambios" : "Crear tipo"}
              </button>
            </div>
          </form>
        </article>

        <article className="content-card">
          <h2>Catalogo actual</h2>
          <div className="admin-machine-list">
            {machineTypes.map((machineType) => (
              <button key={machineType.id} type="button" className="admin-machine-item" onClick={() => startEdit(machineType)}>
                <img src={machineType.assetPath} alt={machineType.name} />
                <div>
                  <strong>{machineType.name}</strong>
                  <span>{machineType.isPublished ? "Publicado" : "Oculto"}</span>
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
