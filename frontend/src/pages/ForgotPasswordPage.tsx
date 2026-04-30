import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { api } from "../lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("tabata.ahumada@usm.cl");
  const [message, setMessage] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDebugToken(null);

    try {
      const response = await api.forgotPassword(email);
      setMessage(response.message);
      setDebugToken(response.debugResetToken ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la solicitud.");
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
            <h2>Recuperar contrasena</h2>
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>

              <button type="submit" className="primary-login-button">
                Enviar enlace
              </button>
            </form>

            {message ? <p className="feedback-success">{message}</p> : null}
            {error ? <p className="feedback-error">{error}</p> : null}
            {debugToken ? (
              <p className="inline-note">
                Token de desarrollo: <Link to={`/reset-password?token=${debugToken}`}>abrir formulario de cambio</Link>
              </p>
            ) : null}

            <p className="inline-note">
              <Link to="/login">Volver a iniciar sesion</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
