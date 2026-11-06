// Pases libres del CRM (invitación de prueba): código NOMBRE-XXXXX (DAVID-K7Q2M),
// o PASE-XXXX en los pases antiguos. La parte final siempre lleva una letra,
// así no se confunde con el código de asistencia del alumno (DF-1, MS-21).
// Un lector de QR/código de barras "escribe" el código y presiona Enter,
// así que cualquier buscador de check-in lo puede reconocer.
import { api } from "../api/cliente";

export const esCodigoPase = (t) =>
  /^\s*(PASE-[A-Z0-9]{3,10}|[A-Z]{2,18}-(?=[A-Z0-9]*[A-Z])[A-Z0-9]{5})\s*$/i.test(String(t || ""));

/** Valida y marca como usado. Devuelve { ok, prospecto?, mensaje } */
export async function validarPaseLibre(codigo) {
  try {
    const p = await api("/prospectos/pase/validar", { method: "POST", body: { codigo: String(codigo).trim().toUpperCase() } });
    return { ok: true, prospecto: p, mensaje: `🎟️ PASE LIBRE VÁLIDO: ${p.fullName} puede entrar hoy a probar las instalaciones${p.planName ? ` (le interesa ${p.planName})` : ""}.` };
  } catch (e) {
    return { ok: false, mensaje: `Pase libre no válido: ${e.message}` };
  }
}
