// Antes de iniciar: cierra copias viejas del sistema que se quedaron abiertas
// ocupando los puertos 3000 (web) y 4000 (API). Solo cierra procesos de Node.
const { execSync } = require("child_process");
const PUERTOS = [3000, 4000];

function pidsEnPuerto(puerto) {
  try {
    if (process.platform === "win32") {
      const salida = execSync("netstat -ano -p tcp", { encoding: "utf8" });
      return [
        ...new Set(
          salida
            .split(/\r?\n/)
            .filter((l) => /LISTENING|ESCUCHANDO/i.test(l) && new RegExp(`:${puerto}\\s`).test(l))
            .map((l) => l.trim().split(/\s+/).pop())
            .filter((p) => p && p !== "0" && Number(p) !== process.pid),
        ),
      ];
    }
    return execSync(`lsof -ti tcp:${puerto} -sTCP:LISTEN`, { encoding: "utf8" }).split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}

function esNode(pid) {
  try {
    if (process.platform === "win32") {
      return /node\.exe/i.test(execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: "utf8" }));
    }
    return /node/i.test(execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" }));
  } catch {
    return false;
  }
}

for (const puerto of PUERTOS) {
  for (const pid of pidsEnPuerto(puerto)) {
    if (!esNode(pid)) {
      console.log(`El puerto ${puerto} lo usa otro programa (PID ${pid}); ciérralo para usar ese puerto.`);
      continue;
    }
    try {
      execSync(process.platform === "win32" ? `taskkill /PID ${pid} /T /F` : `kill -9 ${pid}`, { stdio: "ignore" });
      console.log(`Se cerró una copia anterior del sistema que ocupaba el puerto ${puerto}.`);
    } catch {
      /* ya estaba cerrada */
    }
  }
}
