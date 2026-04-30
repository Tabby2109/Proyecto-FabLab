import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, MachineType } from "../lib/api";

export function MachinesPage() {
  const navigate = useNavigate();
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMachineTypes()
      .then(setMachineTypes)
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredMachineTypes = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    if (!lowered) {
      return machineTypes;
    }

    return machineTypes.filter((machineType) =>
      [machineType.name, machineType.summary, machineType.description].some((value) => value.toLowerCase().includes(lowered))
    );
  }, [machineTypes, searchTerm]);

  return (
    <div className="portal-page machines-page">
      <div className="breadcrumb">Inicio &gt; tipos_maquinas_info</div>
      <h1 className="page-title">Maquinas</h1>

      <section className="machines-search">
        <div className="projects-search">
          <Search size={22} strokeWidth={1.9} />
          <input placeholder="Buscar" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
      </section>

      {error ? <p className="feedback-error">{error}</p> : null}

      <section className="machines-grid">
        {filteredMachineTypes.map((machineType) => (
          <article key={machineType.id} className="machine-card">
            <div className="machine-card-media">
              <img src={machineType.assetPath} alt={machineType.name} />
            </div>
            <div className="machine-card-body">
              <h2>{machineType.name}</h2>
              <p>{machineType.summary}</p>
              <button type="button" className="machine-card-button" onClick={() => navigate(`/maquinas/${machineType.id}`)}>
                Ver mas
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
