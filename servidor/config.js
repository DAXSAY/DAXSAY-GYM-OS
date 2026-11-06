// Carga la configuración (conexión a MySQL y secreto de sesión).
// Usa ".env" si existe; si no, "gestion_radicalgym.env". Ambos están en .gitignore.
import fs from "fs";
import dotenv from "dotenv";

const archivo = [".env", "gestion_radicalgym.env"].find((f) => fs.existsSync(f));
if (archivo) dotenv.config({ path: archivo, quiet: true });
export const archivoConfiguracion = archivo || null;
