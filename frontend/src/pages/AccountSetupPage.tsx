import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthUser } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const careerOptions = [
  "Ingenieria Civil Telematica",
  "Ingenieria Civil Informatica",
  "Ingenieria en Diseno de Productos",
  "Arquitectura",
  "Otra"
];

function formatBirthDate(dateValue?: string | null) {
  if (!dateValue) {
    return "";
  }

  return dateValue.slice(0, 10);
}

type AccountFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  maternalLastName: string;
  documentType: NonNullable<AuthUser["documentType"]>;
  documentNumber: string;
  career: string;
  entryYear: string;
  birthDate: string;
  sex: NonNullable<AuthUser["sex"]>;
};

export function AccountSetupPage() {
  const { user, saveProfile } = useAuth();
  const navigate = useNavigate();

  const initialForm = useMemo<AccountFormState>(
    () => ({
      firstName: user?.firstName ?? "",
      middleName: user?.middleName ?? "",
      lastName: user?.lastName ?? "",
      maternalLastName: user?.maternalLastName ?? "",
      documentType: user?.documentType ?? "RUT",
      documentNumber: user?.documentNumber ?? "",
      career: user?.career ?? "Ingenieria Civil Telematica",
      entryYear: String(user?.entryYear ?? 2020),
      birthDate: formatBirthDate(user?.birthDate),
      sex: user?.sex ?? "FEMALE"
    }),
    [user]
  );

  const [form, setForm] = useState<AccountFormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await saveProfile({
        firstName: form.firstName,
        middleName: form.middleName || null,
        lastName: form.lastName,
        maternalLastName: form.maternalLastName || null,
        documentType: form.documentType as "RUT" | "PASSPORT" | "DNI" | "OTHER",
        documentNumber: form.documentNumber,
        career: form.career,
        entryYear: Number(form.entryYear),
        birthDate: form.birthDate,
        sex: form.sex as "FEMALE" | "MALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY"
      });
      setMessage("Datos actualizados correctamente.");
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la cuenta.");
    }
  }

  return (
    <div className="portal-page portal-page-account">
      <div className="breadcrumb">Inicio &gt; cuenta</div>
      <h1 className="page-title">Configuracion de la cuenta</h1>

      <form className="account-form" onSubmit={handleSubmit}>
        <label>
          <span className="field-head">
            <span className="field-title">Nombre</span>
            <span className="required">*</span>
          </span>
          <input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Segundo nombre</span>
          </span>
          <input value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Apellido paterno</span>
            <span className="required">*</span>
          </span>
          <input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Apellido materno</span>
          </span>
          <input value={form.maternalLastName} onChange={(event) => setForm({ ...form, maternalLastName: event.target.value })} />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Tipo Documento</span>
            <span className="required">*</span>
          </span>
          <select
            value={form.documentType}
            onChange={(event) =>
              setForm({
                ...form,
                documentType: event.target.value as AccountFormState["documentType"]
              })
            }
          >
            <option value="RUT">RUT</option>
            <option value="PASSPORT">Pasaporte</option>
            <option value="DNI">DNI</option>
            <option value="OTHER">Otro</option>
          </select>
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">N deg Documento</span>
            <span className="required">*</span>
          </span>
          <input value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} required />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Carrera</span>
          </span>
          <select value={form.career} onChange={(event) => setForm({ ...form, career: event.target.value })}>
            {careerOptions.map((career) => (
              <option key={career} value={career}>
                {career}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Ano de Ingreso</span>
          </span>
          <input type="number" value={form.entryYear} onChange={(event) => setForm({ ...form, entryYear: event.target.value })} required />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Email</span>
            <span className="required">*</span>
          </span>
          <input value={user?.email ?? ""} disabled />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Fecha de nacimiento</span>
            <span className="required">*</span>
          </span>
          <input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} required />
        </label>

        <label>
          <span className="field-head">
            <span className="field-title">Sexo</span>
          </span>
          <select
            value={form.sex}
            onChange={(event) =>
              setForm({
                ...form,
                sex: event.target.value as AccountFormState["sex"]
              })
            }
          >
            <option value="FEMALE">Femenino</option>
            <option value="MALE">Masculino</option>
            <option value="NON_BINARY">No binario</option>
            <option value="PREFER_NOT_TO_SAY">Prefiero no indicar</option>
          </select>
        </label>

        <div className="account-actions">
          <button type="button" className="secondary-button" onClick={() => setForm(initialForm)}>
            Cancelar
          </button>
          <button type="submit" className="primary-button">
            Actualizar
          </button>
        </div>
      </form>

      {message ? <p className="feedback-success">{message}</p> : null}
      {error ? <p className="feedback-error">{error}</p> : null}
    </div>
  );
}
