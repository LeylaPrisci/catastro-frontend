import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, API_BASE_URL, extraerMensajeError } from "../api/client";

interface Tramite {
  id: string;
  tipo: string;
  profesionalId: string;
  superficieM2: string;
  partidaCatastral: string | null;
}

interface Pago {
  id: string;
  derechoPresentacion: string;
  derechoAprobacion: string;
  canonSat: string | null;
  multa: string | null;
  total: string;
  estado: string;
  fechaPago: string;
}

interface HistorialItem {
  id: string;
  estadoAnterior: string;
  estadoNuevo: string;
  motivo: string | null;
  createdAt: string;
}

interface Expediente {
  id: string;
  tramiteId: string;
  tipoEtapa: string;
  estado: string;
  expedientePadreId: string | null;
  presentadoAt: string | null;
  visadoAt: string | null;
  habilitadoAt: string | null;
  tramite: Tramite;
  pago: Pago | null;
  historialEstados: HistorialItem[];
}

interface Profesional {
  id: string;
  nombre: string;
}

interface CalculoPago {
  derechoPresentacion: number;
  derechoAprobacion: number;
  canonSat: number | null;
  canonSatPendiente: boolean;
  total: number;
}

interface RequisitoDocumento {
  tipoDocumentoId: string;
  nombre: string;
  formatosAceptados: string[];
  obligatorio: boolean;
  cumplido: boolean;
}

interface DocumentoCargado {
  id: string;
  tipoDocumentoId: string;
  archivoUrl: string;
  estadoValidacion: string;
  createdAt: string;
}

const ESTADO_BADGE: Record<string, string> = {
  BORRADOR: "badge",
  PRESENTADO: "badge badge-ingeniero",
  EN_REVISION: "badge badge-maestro",
  VISADO: "badge badge-ingeniero",
  RECHAZADO: "badge badge-danger",
  HABILITADO: "badge badge-arquitecto",
};

function formatFecha(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

export function ExpedienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionando, setAccionando] = useState(false);

  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivo, setMotivo] = useState("");

  const [mostrarPago, setMostrarPago] = useState(false);
  const [calculo, setCalculo] = useState<CalculoPago | null>(null);
  const [canonSat, setCanonSat] = useState("");
  const [multa, setMulta] = useState("");

  const [requisitos, setRequisitos] = useState<RequisitoDocumento[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoCargado[]>([]);
  const [subiendoTipoId, setSubiendoTipoId] = useState<string | null>(null);

  async function cargarDatos() {
    if (!id) return;
    setCargando(true);
    try {
      const [resExpediente, resProfesionales, resRequisitos, resDocumentos] = await Promise.all([
        api.get<Expediente>(`/expedientes/${id}`),
        api.get<Profesional[]>("/profesionales"),
        api.get<RequisitoDocumento[]>(`/expedientes/${id}/documentos/requisitos`),
        api.get<DocumentoCargado[]>(`/expedientes/${id}/documentos`),
      ]);
      setExpediente(resExpediente.data);
      setProfesionales(resProfesionales.data);
      setRequisitos(resRequisitos.data);
      setDocumentos(resDocumentos.data);
      setError(null);
    } catch {
      setError("No se pudo cargar el expediente.");
    } finally {
      setCargando(false);
    }
  }

  function documentoVigentePara(tipoDocumentoId: string) {
    // la API ya devuelve los documentos ordenados por fecha de carga descendente
    return documentos.find(
      (d) => d.tipoDocumentoId === tipoDocumentoId && d.estadoValidacion !== "RECHAZADO",
    );
  }

  async function handleSubirDocumento(tipoDocumentoId: string, archivo: File) {
    setSubiendoTipoId(tipoDocumentoId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("tipoDocumentoId", tipoDocumentoId);
      formData.append("archivo", archivo);
      // se pisa el Content-Type default (application/json) para que el navegador
      // arme el multipart/form-data con el boundary correcto
      await api.post(`/expedientes/${id}/documentos`, formData, {
        headers: { "Content-Type": undefined },
      });
      await cargarDatos();
    } catch (err) {
      setError(extraerMensajeError(err, "No se pudo cargar el documento."));
    } finally {
      setSubiendoTipoId(null);
    }
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function ejecutarAccion(accion: () => Promise<unknown>) {
    setAccionando(true);
    setError(null);
    try {
      await accion();
      await cargarDatos();
    } catch (err) {
      setError(extraerMensajeError(err, "No se pudo completar la accion."));
    } finally {
      setAccionando(false);
    }
  }

  function handlePresentar() {
    ejecutarAccion(() => api.post(`/expedientes/${id}/presentar`));
  }

  function handleRevisar() {
    ejecutarAccion(() => api.post(`/expedientes/${id}/revisar`));
  }

  function handleVisar() {
    ejecutarAccion(() => api.post(`/expedientes/${id}/visar`));
  }

  function handleReenviar() {
    ejecutarAccion(() => api.post(`/expedientes/${id}/reenviar`));
  }

  async function handleRechazarSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await ejecutarAccion(() => api.post(`/expedientes/${id}/rechazar`, { motivo }));
    setMostrarRechazo(false);
    setMotivo("");
  }

  async function abrirFormularioPago() {
    setMostrarPago(true);
    try {
      const res = await api.get<CalculoPago>(`/expedientes/${id}/calculo-pago`);
      setCalculo(res.data);
    } catch {
      setError("No se pudo calcular el monto a pagar.");
    }
  }

  async function handlePagarSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await ejecutarAccion(() =>
      api.post(`/expedientes/${id}/pagar`, {
        canonSat: calculo?.canonSatPendiente ? Number(canonSat) : undefined,
        multa: multa ? Number(multa) : undefined,
      }),
    );
    setMostrarPago(false);
    setCalculo(null);
    setCanonSat("");
    setMulta("");
  }

  async function handleCrearProyecto() {
    setAccionando(true);
    setError(null);
    try {
      const res = await api.post(`/expedientes/${id}/proyecto`);
      navigate(`/expedientes/${res.data.id}`);
    } catch (err) {
      setError(extraerMensajeError(err, "No se pudo crear el proyecto."));
      setAccionando(false);
    }
  }

  if (cargando) {
    return (
      <div>
        <Link to="/tramites" className="back-link">
          ← Volver a tramites
        </Link>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!expediente) {
    return (
      <div>
        <Link to="/tramites" className="back-link">
          ← Volver a tramites
        </Link>
        <div className="error-banner">{error ?? "No se encontro el expediente."}</div>
      </div>
    );
  }

  const profesional = profesionales.find((p) => p.id === expediente.tramite.profesionalId);
  const puedeRegistrarPago =
    !expediente.pago && ["PRESENTADO", "EN_REVISION", "VISADO"].includes(expediente.estado);
  const puedeCrearProyecto =
    expediente.tipoEtapa === "ANTEPROYECTO" && expediente.estado === "HABILITADO";

  return (
    <div>
      <Link to="/tramites" className="back-link">
        ← Volver a tramites
      </Link>
      <h1>{expediente.tipoEtapa.replaceAll("_", " ")}</h1>
      <p className="page-subtitle">
        {expediente.tramite.tipo.replaceAll("_", " ")} · {profesional?.nombre ?? "Profesional sin datos"}
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2 className="section-title">Estado actual</h2>
        <div style={{ marginBottom: "1.5rem" }}>
          <span className={ESTADO_BADGE[expediente.estado] ?? "badge"}>{expediente.estado}</span>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Profesional</span>
            <span className="info-value">{profesional?.nombre ?? "-"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Superficie</span>
            <span className="info-value mono">{expediente.tramite.superficieM2} m2</span>
          </div>
          <div className="info-item">
            <span className="info-label">Partida catastral</span>
            <span className="info-value mono">{expediente.tramite.partidaCatastral ?? "-"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Presentado</span>
            <span className="info-value">{formatFecha(expediente.presentadoAt)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Visado</span>
            <span className="info-value">{formatFecha(expediente.visadoAt)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Habilitado</span>
            <span className="info-value">{formatFecha(expediente.habilitadoAt)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Pago</span>
            <span className="info-value">
              {expediente.pago ? `$${expediente.pago.total} - ${expediente.pago.estado}` : "Sin registrar"}
            </span>
          </div>
        </div>

        <div className="action-row">
          {expediente.estado === "BORRADOR" && (
            <button className="btn" disabled={accionando} onClick={handlePresentar}>
              Presentar
            </button>
          )}
          {expediente.estado === "PRESENTADO" && (
            <button className="btn" disabled={accionando} onClick={handleRevisar}>
              Enviar a revision
            </button>
          )}
          {expediente.estado === "EN_REVISION" && (
            <>
              <button className="btn" disabled={accionando} onClick={handleVisar}>
                Visar
              </button>
              <button
                className="btn btn-danger"
                disabled={accionando}
                onClick={() => setMostrarRechazo((v) => !v)}
              >
                Rechazar
              </button>
            </>
          )}
          {expediente.estado === "RECHAZADO" && (
            <button className="btn" disabled={accionando} onClick={handleReenviar}>
              Reenviar (subsanacion)
            </button>
          )}
          {puedeRegistrarPago && (
            <button className="btn btn-secondary" disabled={accionando} onClick={abrirFormularioPago}>
              Registrar pago
            </button>
          )}
          {puedeCrearProyecto && (
            <button className="btn" disabled={accionando} onClick={handleCrearProyecto}>
              Iniciar Proyecto
            </button>
          )}
        </div>

        {mostrarRechazo && (
          <form onSubmit={handleRechazarSubmit} className="form-grid" style={{ marginTop: "1.5rem" }}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Motivo del rechazo</label>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-danger" disabled={accionando}>
                Confirmar rechazo
              </button>
            </div>
          </form>
        )}

        {mostrarPago && (
          <form onSubmit={handlePagarSubmit} className="form-grid" style={{ marginTop: "1.5rem" }}>
            <div className="field">
              <label>Derecho de presentacion</label>
              <span className="info-value mono">
                {calculo ? `$${calculo.derechoPresentacion}` : "calculando..."}
              </span>
            </div>
            <div className="field">
              <label>Derecho de aprobacion</label>
              <span className="info-value mono">
                {calculo ? `$${calculo.derechoAprobacion}` : "calculando..."}
              </span>
            </div>
            {calculo?.canonSatPendiente && (
              <div className="field">
                <label>Canon SAT (superficie &gt; 200m2, sin tabla cargada aun)</label>
                <input
                  type="number"
                  step="0.01"
                  value={canonSat}
                  onChange={(e) => setCanonSat(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="field">
              <label>Multa (opcional)</label>
              <input type="number" step="0.01" value={multa} onChange={(e) => setMulta(e.target.value)} />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn" disabled={accionando || !calculo}>
                Confirmar pago
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Documentacion requerida</h2>
        {requisitos.length === 0 ? (
          <p className="page-subtitle" style={{ margin: 0 }}>
            Este circuito/etapa no tiene documentos requeridos cargados en el sistema.
          </p>
        ) : (
          <div className="requisito-list">
            {requisitos.map((r) => (
              <div key={r.tipoDocumentoId} className="requisito-row">
                <div>
                  <div>{r.nombre}</div>
                  <div className="page-subtitle" style={{ margin: 0 }}>
                    {r.formatosAceptados.join(" / ")}
                    {!r.obligatorio && " · opcional"}
                  </div>
                </div>
                {r.cumplido ? (
                  <a
                    href={`${API_BASE_URL}${documentoVigentePara(r.tipoDocumentoId)?.archivoUrl ?? ""}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="badge badge-arquitecto">Ver documento</span>
                  </a>
                ) : (
                  <label className="btn btn-secondary" style={{ cursor: "pointer", margin: 0 }}>
                    {subiendoTipoId === r.tipoDocumentoId ? "Subiendo..." : "Subir archivo"}
                    <input
                      type="file"
                      accept=".pdf,.dwg,.dxf"
                      style={{ display: "none" }}
                      disabled={subiendoTipoId !== null}
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        e.target.value = "";
                        if (archivo) handleSubirDocumento(r.tipoDocumentoId, archivo);
                      }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Historial</h2>
        {expediente.historialEstados.length === 0 ? (
          <p className="page-subtitle" style={{ margin: 0 }}>
            Todavia no hay transiciones registradas.
          </p>
        ) : (
          <div className="timeline">
            {expediente.historialEstados.map((h) => (
              <div key={h.id} className="timeline-item">
                <span className="timeline-date">{formatFecha(h.createdAt)}</span>
                <div className="timeline-body">
                  <div>
                    {h.estadoAnterior} → {h.estadoNuevo}
                  </div>
                  {h.motivo && <div className="timeline-motivo">{h.motivo}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
