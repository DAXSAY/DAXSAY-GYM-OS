// Código del alumno para marcar asistencia: iniciales + número de registro.
// David Flores (1er alumno) -> DF-1 · Darío Quispe (2do) -> DQ-2.
// El número es único (columna alumnos.codigo, lo pone un trigger por orden de registro);
// las letras solo ayudan a reconocer al alumno y se recalculan si se corrige el nombre.

const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "da", "das", "do", "dos", "di", "van", "von", "mc", "san"]);

const primeraLetra = (texto) => {
  const palabras = String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const util = palabras.find((p) => !PARTICULAS.has(p.toLowerCase())) || palabras[0] || "";
  return util.charAt(0).toUpperCase();
};

/** Iniciales: 1ra letra del nombre + 1ra letra del apellido ("María José" "de la Cruz" -> MC) */
export function inicialesAlumno(nombres, apellidos) {
  const n = primeraLetra(nombres);
  let a = primeraLetra(apellidos);
  if (!a) a = primeraLetra(String(nombres || "").trim().split(/\s+/).slice(1).join(" "));
  return (n + a) || "X";
}

/** Código visible: DF-1 */
export const codigoAlumno = (numero, nombres, apellidos) =>
  numero == null || numero === "" ? "" : `${inicialesAlumno(nombres, apellidos)}-${Number(numero)}`;
