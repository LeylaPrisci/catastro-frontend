import { useEffect, useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { api, extraerMensajeError } from "../api/client";

interface Profesional {
  id: string;
  nombre: string;
}

interface Expediente {
  id: string;
  tipoEtapa: string;
  estado: string;
}

interface Tramite {
  id: string;
  tipo: string;
  profesionalId: string;
  superficieM2: string;
  partidaCatastral: string | null;
  profesional?: Profesional;
  expedientes: Expediente[];
}

const TIPOS = ["OBRA_NUEVA", "OBRA_CONSTRUIDA", "CONFORME_A_OBRA"];

const ESTADO_CLASS: Record<string, string> = {
  BORRADOR: "badge",
  PRESENTADO: "badge badge-ingeniero",
  EN_REVISION: "badge badge-maestro",
  VISADO: "badge badge-ingeniero",
  RECHAZADO: "badge badge-danger",
  HABILITADO: "badge badge-arquitecto",
};

export function TramitesPage() {
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profesionalId, setProfesionalId] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [superficieM2, setSuperficieM2] = useState("");
  const [partidaCatastral, setPartidaCatastral] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargarDatos() {
    setCargando(true);
    try {
      const [resTramites, resProfesionales] = await Promise.all([
        api.get<Tramite[]>("/tramites"),
        api.get<Profesional[]>("/profesionales"),
      ]);
      setTramites(resTramites.data);
      setProfesionales(resProfesionales.data);
      if (!profesionalId && resProfesionales.data.length > 0) {
        setProfesionalId(resProfesionales.data[0].id);
      }
      setError(null);
    } catch {
      setError("No se pudo cargar la informacion.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.post("/tramites", {
        tipo,
        profesionalId,
        superficieM2: Number(superficieM2),
        partidaCatastral: partidaCatastral || undefined,
      });
      setSuperficieM2("");
      setPartidaCatastral("");
      await cargarDatos();
    } catch (err) {
      setError(extraerMensajeError(err, "Error al crear el tramite."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1>Tramites</h1>
      <p className="page-subtitle">Alta y seguimiento de trámites y sus expedientes.</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Profesional</label>
            <select value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)} required>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tipo de circuito</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Superficie (m2)</label>
            <input
              type="number"
              step="0.01"
              value={superficieM2}
              onChange={(e) => setSuperficieM2(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Partida catastral (opcional)</label>
            <input value={partidaCatastral} onChange={(e) => setPartidaCatastral(e.target.value)} />
          </div>
          <div className="btn-row">
            <button type="submit" className="btn" disabled={enviando || !profesionalId}>
              {enviando ? "Creando..." : "Crear tramite"}
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
              <th>Tipo</th>
              <th>Profesional</th>
              <th>Superficie</th>
              <th>Expediente actual</th>
            </tr>
          </thead>
          <tbody>
            {tramites.map((t) => {
              const expediente = t.expedientes[t.expedientes.length - 1];
              return (
                <tr key={t.id}>
                  <td>{t.tipo.replaceAll("_", " ")}</td>
                  <td>{t.profesional?.nombre ?? "-"}</td>
                  <td className="mono">{t.superficieM2} m2</td>
                  <td>
                    {expediente ? (
                      <Link to={`/expedientes/${expediente.id}`}>
                        <span className={ESTADO_CLASS[expediente.estado] ?? "badge"}>
                          {expediente.tipoEtapa} - {expediente.estado}
                        </span>
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
