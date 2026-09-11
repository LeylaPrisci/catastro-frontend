import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

interface Tramite {
  id: string;
  tipo: string;
  profesionalId: string;
  superficieM2: string;
}

interface Pago {
  total: string;
  estado: string;
}

interface Expediente {
  id: string;
  tipoEtapa: string;
  estado: string;
  tramite: Tramite;
  pago: Pago | null;
}

interface Profesional {
  id: string;
  nombre: string;
}

const ESTADO_BADGE: Record<string, string> = {
  BORRADOR: "badge",
  PRESENTADO: "badge badge-ingeniero",
  EN_REVISION: "badge badge-maestro",
  VISADO: "badge badge-ingeniero",
  RECHAZADO: "badge badge-danger",
  HABILITADO: "badge badge-arquitecto",
};

export function ExpedientesPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const [resExpedientes, resProfesionales] = await Promise.all([
          api.get<Expediente[]>("/expedientes"),
          api.get<Profesional[]>("/profesionales"),
        ]);
        setExpedientes(resExpedientes.data);
        setProfesionales(resProfesionales.data);
        setError(null);
      } catch {
        setError("No se pudo cargar la lista de expedientes.");
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  return (
    <div>
      <h1>Expedientes</h1>
      <p className="page-subtitle">Todos los expedientes generados por los tramites.</p>

      {error && <div className="error-banner">{error}</div>}

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Tramite</th>
              <th>Profesional</th>
              <th>Superficie</th>
              <th>Estado</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.map((e) => {
              const profesional = profesionales.find((p) => p.id === e.tramite.profesionalId);
              return (
                <tr key={e.id}>
                  <td>{e.tipoEtapa.replaceAll("_", " ")}</td>
                  <td>{e.tramite.tipo.replaceAll("_", " ")}</td>
                  <td>{profesional?.nombre ?? "-"}</td>
                  <td className="mono">{e.tramite.superficieM2} m2</td>
                  <td>
                    <Link to={`/expedientes/${e.id}`}>
                      <span className={ESTADO_BADGE[e.estado] ?? "badge"}>{e.estado}</span>
                    </Link>
                  </td>
                  <td className="mono">{e.pago ? `$${e.pago.total}` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
