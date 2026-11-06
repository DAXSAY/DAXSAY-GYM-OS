# Publicar RADICAL en internet

El sistema es **una sola aplicación Node.js** (API + web) y **una base MySQL**.
En producción, la API sirve también la web compilada (`dist/`), así que los
alumnos y el personal entran por una sola dirección, por ejemplo
`https://radicalgym.daxsay.app` (sistema DAXSAY Gym OS).

## Qué hosting comprar

| Opción | Para quién | Ejemplos |
|---|---|---|
| **VPS** (recomendado) | Control total, precio fijo | DigitalOcean, Hetzner, Contabo, AWS Lightsail (2 GB RAM bastan) |
| PaaS + MySQL administrado | Sin administrar servidor | Railway, Render + PlanetScale/Aiven/AWS RDS |

> ⚠️ El **hosting compartido tipo cPanel solo-PHP no sirve**: se necesita Node.js 20+
> y MySQL 8 (o MariaDB 10.6+) con permiso para crear *triggers* y *procedimientos*.

## 1. Base de datos

1. Crea la base y un usuario propio para la app (no uses `root`):

   ```sql
   CREATE USER 'radicalgym_app'@'localhost' IDENTIFIED BY 'una-clave-larga-y-segura';
   GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON gestion_radicalgym.* TO 'radicalgym_app'@'localhost';
   ```

2. Instala con un usuario administrador (necesita crear tablas, triggers y procedimientos):
   - **Base nueva:** ejecuta `base_datos/gestion_radicalgym.sql` y luego, en orden, los
     scripts `05_...sql` al `19_...sql` (se pueden repetir sin dañar datos).
   - **Pasar tus datos actuales:** exporta tu base local con
     `mysqldump --routines --triggers --default-character-set=utf8mb4 gestion_radicalgym > respaldo.sql`
     e impórtala en el servidor.
3. Si MySQL tiene el registro binario activo (lo normal en la nube) y da error al crear
   triggers, activa `log_bin_trust_function_creators = 1` en la configuración del servidor
   o del proveedor.
4. Todos los scripts empiezan con `SET NAMES utf8mb4`: tildes, ñ e íconos se guardan bien
   aunque se ejecuten desde consola.

## 2. Aplicación

```bash
git clone <tu repositorio> radicalgym && cd radicalgym
cp .env.example .env        # y complétalo (ver abajo)
npm ci
npm run build               # crea dist/
npm start                   # API + web en el puerto API_PORT
```

`.env` en el servidor:

```
DB_HOST=127.0.0.1
DB_USER=radicalgym_app
DB_PASSWORD=...
DB_NAME=gestion_radicalgym
JWT_SECRET=...   # 48+ caracteres: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
API_PORT=4000
NODE_ENV=production
TRUST_PROXY=1
```

Con `NODE_ENV=production` la API **no arranca** si el `JWT_SECRET` es débil.

Para que siga corriendo, se reinicie sola si falla y arranque con el servidor:

```bash
npm i -g pm2
pm2 start servidor/index.js --name radicalgym --max-memory-restart 400M --time
pm2 save && pm2 startup     # copia y ejecuta el comando que te muestra
pm2 logs radicalgym         # ver qué pasa en vivo
```

La carpeta `uploads/` (fotos de ejercicios, alimentos y medidas) vive en el servidor:
inclúyela en los respaldos. `DB_POOL=15` (opcional) es cuántas conexiones a MySQL usa la app a la vez.

## 3. Dominio y HTTPS (Nginx)

```nginx
server {
    server_name radicalgym.daxsay.app;
    client_max_body_size 5m;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Certificado gratis: `sudo certbot --nginx -d radicalgym.daxsay.app`.

## 4. Antes de abrirlo al público

- [ ] Cambiar las contraseñas iniciales (`admin`, `recepcion`, `entrenador`, `fisioterapia`, `nutricion`).
- [ ] Configurar el WhatsApp del gimnasio y del administrador (Usuarios & Accesos → Configuración).
- [ ] Respaldo diario de la base, por ejemplo con cron a las 3 a. m.:
      `mysqldump --single-transaction --routines --triggers gestion_radicalgym | gzip > /respaldos/gym_$(date +\%F).sql.gz`
      (guarda copias fuera del servidor).
- [ ] Probar `https://radicalgym.daxsay.app/api/salud` → `{"api":"ok","baseDatos":"ok"}`.
- [ ] Monitor gratis (UptimeRobot o Better Stack) que abra `/api/salud` cada 5 minutos y te avise por correo o WhatsApp si se cae.
- [ ] Respaldo de `uploads/` junto con la base (por ejemplo `tar czf /respaldos/uploads_$(date +\%F).tgz uploads`).

## Varias sesiones a la vez

Admin, recepción, fisioterapia, nutrición, entrenadores y alumnos pueden estar conectados
al mismo tiempo, cada uno en su equipo o celular. Cada pantalla se actualiza sola cada
60 segundos y al volver a la pestaña. Prueba hecha: 14 sesiones simultáneas, más de 9000
consultas en 40 s, sin errores (p95 de 35 ms).

## Seguridad que ya trae el sistema

- Contraseñas cifradas con bcrypt; sesiones firmadas y guardadas en la base (se pueden cerrar).
- Bloqueo de la cuenta tras varios intentos fallidos y límite de 30 intentos fallidos por conexión cada 15 min (los ingresos correctos no cuentan, para que el WiFi del gimnasio no se bloquee).
- Permisos por rol y por módulo en la API (no solo en pantalla); cada alumno solo ve sus datos.
- Consultas preparadas (sin inyección SQL), cabeceras de seguridad y errores internos sin detalles.
- Mantenimiento automático cada 6 h (estados de membresías y limpieza de sesiones viejas).

## Actualizar a una versión nueva

1. Respaldo de la base.
2. Ejecutar en orden los scripts `base_datos/NN_*.sql` nuevos (se pueden repetir sin dañar datos).
3. `git pull && npm ci && npm run build && pm2 restart radicalgym`.
