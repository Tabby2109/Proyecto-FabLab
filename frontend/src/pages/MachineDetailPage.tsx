import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, MachineType } from "../lib/api";

export function MachineDetailPage() {
  const { machineTypeId = "" } = useParams();
  const [machineType, setMachineType] = useState<MachineType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMachineTypeById(machineTypeId)
      .then(setMachineType)
      .catch((err: Error) => setError(err.message));
  }, [machineTypeId]);

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  if (!machineType) {
    return <div className="content-card">Cargando detalle de la maquina...</div>;
  }

  return (
    <div className="portal-page machine-detail-page">
      <div className="breadcrumb">Inicio &gt; tipos_maquinas_info &gt; {machineType.id}</div>
      <h1 className="page-title">Detalle de la Maquina</h1>

      <section className="machine-detail-card">
        <div className="machine-detail-block">
          <div className="machine-detail-row">
            <strong>Nombre:</strong>
            <span>{machineType.name}</span>
          </div>
          <div className="machine-detail-row">
            <strong>Descripcion:</strong>
            <span>{machineType.summary}</span>
          </div>
        </div>

        <div className="machine-detail-files">
          <h2>Archivos</h2>
          <img src={machineType.assetPath} alt={machineType.name} className="machine-detail-image" />
          <p className="machine-detail-filename">{machineType.assetName}</p>
          <a className="machine-detail-download" href={machineType.assetPath} download={machineType.assetName}>
            Descargar
          </a>
        </div>
      </section>
    </div>
  );
}
