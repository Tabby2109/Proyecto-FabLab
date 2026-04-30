import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, AdminMaterial, MaterialMovementPayload, MaterialPayload } from "../lib/api";

const initialMaterialForm: MaterialPayload = {
  name: "",
  slug: "",
  unit: "",
  stockQuantity: 0,
  stockThreshold: 0,
  pricePerUnit: 0,
  isActive: true
};

const initialMovementForm: MaterialMovementPayload = {
  type: "IN",
  quantity: 1,
  reason: ""
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("es-CL");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

export function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialPayload>(initialMaterialForm);
  const [movementForm, setMovementForm] = useState<MaterialMovementPayload>(initialMovementForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === selectedMaterialId) ?? materials[0] ?? null,
    [materials, selectedMaterialId]
  );

  async function loadMaterials() {
    const data = await api.getAdminMaterials();
    setMaterials(data);
    setSelectedMaterialId((current) => current ?? data[0]?.id ?? null);
  }

  useEffect(() => {
    loadMaterials().catch((err: Error) => setError(err.message));
  }, []);

  function startCreate() {
    setEditingId(null);
    setMaterialForm(initialMaterialForm);
    setMessage(null);
    setError(null);
  }

  function startEdit(material: AdminMaterial) {
    setEditingId(material.id);
    setSelectedMaterialId(material.id);
    setMaterialForm({
      name: material.name,
      slug: material.slug,
      unit: material.unit,
      stockQuantity: material.stockQuantity,
      stockThreshold: material.stockThreshold,
      pricePerUnit: material.pricePerUnit,
      isActive: material.isActive
    });
    setMessage(null);
    setError(null);
  }

  async function handleMaterialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const payload = {
        ...materialForm,
        slug: materialForm.slug || slugify(materialForm.name)
      };

      if (editingId) {
        await api.updateMaterial(editingId, payload);
        setMessage("Material actualizado.");
      } else {
        await api.createMaterial(payload);
        setMessage("Material creado.");
      }

      await loadMaterials();
      setEditingId(null);
      setMaterialForm(initialMaterialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el material.");
    }
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMaterial) {
      return;
    }

    setMessage(null);
    setError(null);

    try {
      await api.createMaterialMovement(selectedMaterial.id, movementForm);
      setMessage("Movimiento registrado.");
      setMovementForm(initialMovementForm);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento.");
    }
  }

  return (
    <div className="portal-page admin-materials-page">
      <div className="breadcrumb">Inicio &gt; admin &gt; materiales</div>
      <h1 className="page-title">Administrar Materiales e Insumos</h1>

      <section className="admin-machines-layout admin-materials-layout">
        <article className="content-card">
          <div className="admin-machines-head">
            <h2>{editingId ? "Editar material" : "Nuevo material"}</h2>
            <button type="button" className="machine-card-button" onClick={startCreate}>
              Nuevo
            </button>
          </div>

          <form className="admin-machines-form" onSubmit={handleMaterialSubmit}>
            <label>
              Nombre
              <input
                value={materialForm.name}
                onChange={(event) => setMaterialForm({ ...materialForm, name: event.target.value, slug: editingId ? materialForm.slug : slugify(event.target.value) })}
                required
              />
            </label>
            <label>
              Slug
              <input value={materialForm.slug} onChange={(event) => setMaterialForm({ ...materialForm, slug: event.target.value })} required />
            </label>
            <label>
              Unidad
              <input value={materialForm.unit} onChange={(event) => setMaterialForm({ ...materialForm, unit: event.target.value })} required />
            </label>
            <label>
              Stock total
              <input
                type="number"
                min="0"
                step="0.01"
                value={materialForm.stockQuantity}
                onChange={(event) => setMaterialForm({ ...materialForm, stockQuantity: Number(event.target.value) })}
                required
              />
            </label>
            <label>
              Stock minimo
              <input
                type="number"
                min="0"
                step="0.01"
                value={materialForm.stockThreshold}
                onChange={(event) => setMaterialForm({ ...materialForm, stockThreshold: Number(event.target.value) })}
                required
              />
            </label>
            <label>
              Precio por unidad
              <input
                type="number"
                min="0"
                step="1"
                value={materialForm.pricePerUnit}
                onChange={(event) => setMaterialForm({ ...materialForm, pricePerUnit: Number(event.target.value) })}
                required
              />
            </label>
            <label className="admin-machines-checkbox">
              <input type="checkbox" checked={materialForm.isActive} onChange={(event) => setMaterialForm({ ...materialForm, isActive: event.target.checked })} />
              <span>Disponible para nuevas solicitudes</span>
            </label>

            <div className="account-actions">
              <button type="submit" className="primary-button">
                {editingId ? "Guardar cambios" : "Crear material"}
              </button>
            </div>
          </form>
        </article>

        <article className="content-card">
          <div className="admin-machines-head">
            <h2>Catalogo actual</h2>
          </div>

          <div className="admin-material-summary-grid">
            {materials.map((material) => (
              <button key={material.id} type="button" className="admin-material-item" onClick={() => startEdit(material)}>
                <div>
                  <strong>{material.name}</strong>
                  <span>{material.isActive ? "Activo" : "Inactivo"}</span>
                </div>
                <div className="admin-material-item-stats">
                  <span>Total: {material.stockQuantity.toFixed(2)}</span>
                  <span>Reservado: {material.reservedQuantity.toFixed(2)}</span>
                  <span className={material.lowStock ? "inventory-inline-warning" : "inventory-inline-muted"}>
                    Disponible: {material.availableQuantity.toFixed(2)} {material.unit}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </article>
      </section>

      {selectedMaterial ? (
        <section className="project-detail-grid admin-materials-detail-grid">
          <article className="content-card project-detail-card">
            <div className="project-detail-card-head">
              <h2>Estado de inventario</h2>
            </div>

            <div className="project-meta-grid">
              <div>
                <span>Stock total</span>
                <strong>{selectedMaterial.stockQuantity.toFixed(2)} {selectedMaterial.unit}</strong>
              </div>
              <div>
                <span>Stock reservado</span>
                <strong>{selectedMaterial.reservedQuantity.toFixed(2)} {selectedMaterial.unit}</strong>
              </div>
              <div>
                <span>Disponible</span>
                <strong>{selectedMaterial.availableQuantity.toFixed(2)} {selectedMaterial.unit}</strong>
              </div>
              <div>
                <span>Stock minimo</span>
                <strong>{selectedMaterial.stockThreshold.toFixed(2)} {selectedMaterial.unit}</strong>
              </div>
              <div>
                <span>Precio unitario</span>
                <strong>{formatCurrency(selectedMaterial.pricePerUnit)}</strong>
              </div>
            </div>

            {selectedMaterial.lowStock ? (
              <div className="inventory-warning-block">
                <strong>Alerta de stock bajo</strong>
                <span>
                  La disponibilidad actual quedo bajo el minimo definido. Conviene reponer o ajustar solicitudes antes de seguir aprobando trabajos con este material.
                </span>
              </div>
            ) : null}
          </article>

          <article className="content-card project-detail-card">
            <div className="project-detail-card-head">
              <h2>Registrar movimiento</h2>
            </div>

            <form className="staff-action-form" onSubmit={handleMovementSubmit}>
              <label>
                Tipo
                <select value={movementForm.type} onChange={(event) => setMovementForm({ ...movementForm, type: event.target.value as MaterialMovementPayload["type"] })}>
                  <option value="IN">Ingreso</option>
                  <option value="OUT">Salida</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                </select>
              </label>

              {movementForm.type === "ADJUSTMENT" ? (
                <label>
                  Stock objetivo
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={movementForm.targetStockQuantity ?? 0}
                    onChange={(event) => setMovementForm({ ...movementForm, targetStockQuantity: Number(event.target.value), quantity: undefined })}
                    required
                  />
                </label>
              ) : (
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={movementForm.quantity ?? 1}
                    onChange={(event) => setMovementForm({ ...movementForm, quantity: Number(event.target.value), targetStockQuantity: undefined })}
                    required
                  />
                </label>
              )}

              <label>
                Motivo
                <textarea rows={4} value={movementForm.reason} onChange={(event) => setMovementForm({ ...movementForm, reason: event.target.value })} required />
              </label>

              <button type="submit" className="primary-button">
                Registrar movimiento
              </button>
            </form>
          </article>

          <article className="content-card project-detail-card field-span-2">
            <div className="project-detail-card-head">
              <h2>Ultimos movimientos</h2>
            </div>

            <div className="stack-list">
              {selectedMaterial.movements.length > 0 ? (
                selectedMaterial.movements.map((movement) => (
                  <div key={movement.id} className="stack-row">
                    <div>
                      <strong>{movement.type}</strong>
                      <p>{movement.reason ?? "Sin detalle adicional."}</p>
                      <p>{formatDateTime(movement.createdAt)}</p>
                    </div>
                    <div className="admin-material-movement-meta">
                      <span>Cantidad: {movement.quantity.toFixed(2)}</span>
                      <span>Stock: {movement.resultingStockQuantity.toFixed(2)}</span>
                      <span>Reservado: {movement.resultingReservedQuantity.toFixed(2)}</span>
                      <span>{movement.actor?.name ?? "Sistema"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No hay movimientos registrados para este material.</p>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {message ? <p className="feedback-success">{message}</p> : null}
      {error ? <p className="feedback-error">{error}</p> : null}
    </div>
  );
}
