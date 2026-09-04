import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Profesional {
  id: string;
  nombre: string;
  email: string;
  matricula: string;
  rol: string;
}

const ROLES = ["ARQUITECTO", "INGENIERO", "MAESTRO_MAYOR_DE_OBRAS"];

const BADGE_CLASS: Record<string, string> = {
  ARQUITECTO: "badge badge-arquitecto",
  INGENIERO: "badge badge-ingeniero",
  MAESTRO_MAYOR_DE_OBRAS: "badge badge-maestro",
};

export function ProfesionalesPage() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [rol, setRol] = useState(ROLES[0]);
  const [enviando, setEnviando] = useState(false);

  async function cargarProfesionales() {
    setCargando(true);
    try {
      const res = await api.get<Profesional[]>("/profesionales");
      setProfesionales(res.data);
      setError(null);
    } catch {
      setError("No se pudo cargar la lista de profesionales.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProfesionales();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.post("/profesionales", { nombre, email, matricula, rol });
      setNombre("");
      setEmail("");
      setMatricula("");
      setRol(ROLES[0]);
      await cargarProfesionales();
    } catch (err: any) {
      const mensajes = err?.response?.data?.message;
      setError(Array.isArray(mensajes) ? mensajes.join(", ") : "Error al crear el profesional.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Profesionales</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Matricula</label>
            <input value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="btn-row">
            <button type="submit" className="btn" disabled={enviando}>
              {enviando ? "Creando..." : "Crear profesional"}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Matricula</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {profesionales.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td className="mono">{p.email}</td>
                <td className="mono">{p.matricula}</td>
                <td>
                  <span className={BADGE_CLASS[p.rol] ?? "badge"}>{p.rol}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
