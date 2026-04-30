import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { api } from "../lib/api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Falta el token de recuperacion.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    try {
      const response = await api.resetPassword(token, password);
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contrasena.");
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card login-card-narrow">
        <section className="login-brand-panel">
          <BrandLogo />
        </section>

        <section className="login-actions login-actions-single">
          <div className="login-form-column">
            <h2>Restablecer contrasena</h2>
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                Nueva contrasena
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
              </label>

              <label>
                Confirmar contrasena
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
              </label>

              <button type="submit" className="primary-login-button">
                Guardar nueva contrasena
              </button>
            </form>

            {message ? <p className="feedback-success">{message}</p> : null}
            {error ? <p className="feedback-error">{error}</p> : null}

            <p className="inline-note">
              <Link to="/login">Volver a iniciar sesion</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
