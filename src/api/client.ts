import axios from "axios";

export const API_BASE_URL = "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Nest devuelve el error de dos formas distintas segun su origen:
 * - un array de strings cuando falla la validacion del DTO (class-validator)
 * - un string simple cuando el service tira un BadRequestException manual
 *   (ej. "Faltan documentos obligatorios para presentar: ...")
 * Si solo se contempla el caso array, el motivo real del segundo caso
 * se pierde y se muestra un mensaje generico en su lugar.
 */
export function extraerMensajeError(err: unknown, fallback: string): string {
  const mensaje = (err as any)?.response?.data?.message;
  if (Array.isArray(mensaje)) return mensaje.join(", ");
  if (typeof mensaje === "string") return mensaje;
  return fallback;
}
