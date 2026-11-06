# RADICAL GYM – Sistema de Gestión de Gimnasio

- **Web:** React + JavaScript (JSX), Tailwind CSS y Vite.
- **API:** Node.js + Express.
- **Base de datos:** MySQL (`gestion_radicalgym`).

## Requisitos
- Node.js 20 o superior
- MySQL 8 o superior con la base `gestion_radicalgym` instalada (ver `base_datos/README.md`)
- Archivo `gestion_radicalgym.env` en la raíz con la conexión a MySQL (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, SESION_HORAS, API_PORT). No se sube a GitHub.

## Cómo ejecutarlo (terminal de VS Code)
```bash
npm install      # solo la primera vez o cuando cambian dependencias
npm run dev      # levanta la API (puerto 4000) y la web (http://localhost:3000)
```

## Estructura
```
base_datos/        scripts SQL de gestion_radicalgym (ver su README)
servidor/          API Node.js
  index.js         arranque, rutas y manejo de errores
  db.js            conexión a MySQL
  seguridad.js     tokens de sesión y permisos
  rutas/           autenticacion, alumnos, catalogos (planes, entrenadores, caja)
src/
  api/cliente.js   llamadas a la API
  config/roles.js  menú de cada rol (los permisos reales vienen de la base)
  context/         estado global (GymContext)
  components/      un folder por módulo
```

## Qué ya está en MySQL (Fase 1)
- **Login y sesiones:** contraseñas con bcrypt, bloqueo tras 5 intentos y permisos por rol leídos de la base.
- **Alumnos y matrículas:** registro, renovación, entrenador asignado y baja.
- **Planes y tarifas.**
- **Entrenadores:** personal con cargo de entrenador.
- **Caja:** ingresos por matrícula (automáticos), ventas POS y egresos manuales.

Los demás módulos (asistencias, citas, nutrición, fisioterapia, rutinas, productos, contratos y planilla) todavía guardan en el navegador. Se irán pasando a MySQL por fases.

## Usuarios
| Rol | Usuario | Contraseña |
|---|---|---|
| Administración | `admin` | `Radical2026!` |
| Entrenador | `entrenador` | `Coach2026!` |
| Fisioterapia | `fisioterapia` | `Fisio2026!` |
| Nutrición | `nutricion` | `Nutri2026!` |
| Recepción | `recepcion` | `Recep2026!` |
