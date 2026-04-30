import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("tabata.ahumada@usm.cl");
  const [password, setPassword] = useState("123fablab..");
  const [error, setError] = useState<string | null>(null);
  const [usmHint, setUsmHint] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const loggedUser = await login(email, password);
      navigate(loggedUser.profileCompleted ? "/" : "/cuenta");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.");
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <section className="login-brand-panel">
          <BrandLogo />
        </section>

        <section className="login-actions">
          <div className="login-sso-column">
            <h2>Sign in with your corporate ID</h2>
            <button
              type="button"
              className="sso-button"
              onClick={() => setUsmHint("La integracion con PasaporteUSM queda preparada como acceso institucional futuro.")}
            >
              PasaporteUSM
            </button>
            {usmHint ? <p className="inline-note">{usmHint}</p> : null}
          </div>

          <div className="login-divider">
            <span>or</span>
          </div>

          <div className="login-form-column">
            <h2>Sign in with your email and password</h2>
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>

              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>

              <button type="button" className="link-button" onClick={() => navigate("/forgot-password")}>
                Forgot your password?
              </button>

              <button type="submit" className="primary-login-button">
                Sign in
              </button>
            </form>

            {error ? <p className="feedback-error">{error}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
