// Código del alumno para marcar asistencia: iniciales + número de registro (DF-1, DQ-2, DS-115).
// El número es único; las letras solo ayudan a reconocerlo. En recepción basta escribir "1",
// o "DF1" / "df-1"; también funcionan el DNI o el nombre.

const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "da", "das", "do", "dos", "di", "van", "von", "mc", "san"]);

const sinTildes = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const primeraLetra = (texto) => {
  const palabras = sinTildes(texto).replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const util = palabras.find((p) => !PARTICULAS.has(p)) || palabras[0] || "";
  return util.charAt(0).toUpperCase();
};

export function inicialesAlumno(nombres, apellidos) {
  const n = primeraLetra(nombres);
  let a = primeraLetra(apellidos);
  if (!a) a = primeraLetra(String(nombres || "").trim().split(/\s+/).slice(1).join(" "));
  return n + a || "X";
}

export const formatoCodigo = (numero, nombres, apellidos) =>
  numero == null || numero === "" ? "" : `${inicialesAlumno(nombres, apellidos)}-${Number(numero)}`;

/**
 * Busca un alumno por código, DNI o nombre.
 * Código: "1", "DF1", "df-1", "DF 1", "#1" (si las letras no coinciden igual vale el número, que es único).
 * @returns {{ member, by: "codigo"|"dni"|"nombre", letrasDistintas?: boolean } | null}
 */
export function buscarAlumno(members, texto) {
  const t = String(texto || "").trim();
  if (!t) return null;
  // 1) Código: letras opcionales (hasta 3) + número de hasta 6 cifras
  const mc = /^#?\s*([a-zñ]{0,3})\s*-?\s*(\d{1,6})$/i.exec(t);
  if (mc && !/^\d{8}$/.test(t)) {
    const n = Number(mc[2]);
    const m = members.find((x) => Number(x.code) === n);
    if (m) {
      const letras = sinTildes(mc[1]).toUpperCase();
      const propias = String(m.codeLabel || "").split("-")[0];
      return { member: m, by: "codigo", letrasDistintas: !!letras && letras !== propias };
    }
    if (mc[1]) return null;
  }
  // 2) DNI exacto
  if (/^\d{8}$/.test(t)) {
    const m = members.find((x) => x.dni === t);
    return m ? { member: m, by: "dni" } : null;
  }
  // 3) Nombre (sin importar tildes ni mayúsculas); si hay varios, el primero que empiece igual
  const q = sinTildes(t);
  if (q.length < 3) return null;
  const coinciden = members.filter((x) => sinTildes(x.fullName).includes(q));
  if (!coinciden.length) return null;
  return { member: coinciden.find((x) => sinTildes(x.fullName).startsWith(q)) || coinciden[0], by: "nombre", varios: coinciden.length };
}
