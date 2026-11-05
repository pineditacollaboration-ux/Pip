# pip
Requisitos: Node 22.5+.

    npm install
    npm run seed     # usuario demo "pineda" (solo con ALLOW_EMAIL_LOGIN=1, para desarrollo)
    npm start        # http://localhost:3000
    npm test         # pruebas (API, subidas, Discord simulado, panel en jsdom y perfil)

## Login con Discord
1. discord.com/developers/applications -> New Application -> OAuth2.
2. Añade el Redirect: `http://localhost:3000/auth/discord/callback` (en producción, tu dominio con https).
3. Arranca con las variables (el secreto va SOLO en el servidor, nunca en el navegador ni en el chat):

        DISCORD_CLIENT_ID=... DISCORD_CLIENT_SECRET=... PUBLIC_URL=http://localhost:3000 npm start

pip es solo-Discord: no hay formulario de correo. Solo para desarrollo/pruebas existe la API de correo, apagada por defecto (ALLOW_EMAIL_LOGIN=1).
Permisos OAuth pedidos: `identify email`; al configurar `DISCORD_GUILD_ID` y `DISCORD_BOT_TOKEN`, también se solicita `guilds.join` para incorporar al usuario al servidor sincronizado. La presencia y Spotify no vienen del OAuth: los consulta el bot de Gateway.

### Presencia, actividad y Spotify
Configura `DISCORD_GUILD_ID` y `DISCORD_BOT_TOKEN`. Invita el bot al servidor indicado y habilita **Presence Intent** en Discord Developer Portal → Bot → Privileged Gateway Intents; el bot también necesita el intent `Guild Presences` (ya solicitado por el código). Los usuarios deben pertenecer al servidor y tener visibles sus actividades. Sin esos requisitos, pip puede mostrar el estado como no disponible/desconectado y no mostrará actividades. La presencia se consulta al cargar el perfil o al pulsar “Actualizar estado” en el dashboard.

## Variables
PORT, SUPABASE_URL, SUPABASE_SERVICE_KEY (o SUPABASE_ANON_KEY), UPLOAD_DIR (uploads), PIP_SECRET (huella de visitantes), PUBLIC_URL, NODE_ENV=production (cookie Secure, requiere HTTPS), DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, DISCORD_GUILD_ID, DISCORD_BOT_TOKEN.

## Estructura
src/app.js (API, rutas, Discord) · src/settings-spec.js (esquema único de ajustes: valida el servidor y dibuja el panel) · src/badges.js (insignias) · src/profile-page.js (página pública) · public/ (landing, acceso, panel).
Para añadir un ajuste nuevo basta una línea en settings-spec.js (y usarlo en profile-page.js).

## Conteo de visitas
Cada navegador anónimo cuenta una vez por perfil y día (UTC), mediante una cookie aleatoria `pip_visitor`. Recargar no suma otra visita y la identidad se conserva al reiniciar el servidor. El dueño con sesión iniciada, las solicitudes HEAD y la vista previa del editor no cuentan. Otro navegador o borrar cookies puede contar de nuevo; no es identificación de personas ni protección contra bots. No se recalculan los totales históricos.

Pruebas aisladas del contador: `node --test test/visits.test.js`.
## Instancia personal de Pineda

Configurar PINEDA_USER_ID y PINEDA_DISCORD_ID con los identificadores de la cuenta existente. No se crean cuentas desde la web y el servidor falla cerrado si faltan estas variables. Se requiere SUPABASE_SERVICE_KEY en el servidor. Consultar SECURITY.md para controles aplicados y revisión pendiente de infraestructura.

El editor incluye búsqueda por categoría, accesos a sus bloques, restauración de los valores guardados y preajustes en Perfil, Enlaces, Fondo, Efectos, Widgets e Insignias. Diseño permite ajustar el espacio entre letras del nombre. Cuenta permite cerrar las otras sesiones. Las insignias usan iconos SVG basados en Lucide (ISC), incluidos en la dependencia lucide-static.

## Novedades v34
- **Perfil público**: partículas Lluvia, Polvo estelar y Confeti; efectos de pantalla Foco de luz y Atardecer; fondo con saturación, brillo y zoom lento; reflejo de luz que sigue al ratón en la tarjeta; enlaces en cascada.
- **Widgets nuevos**: Disponibilidad (punto pulsante), Cita o lema y Botón destacado (solo enlaces http/https). Todos nacen de una línea en `settings-spec.js`.
- **Panel**: Identidad del perfil con vista previa en vivo, código hex, colores sin duplicados y subida con arrastrar y soltar (valida tamaño y tipo). Añadir vistas con modo "Fijar total", barra de progreso, paso configurable, confirmación en cantidades grandes, historial y teclado (Enter, ↑/↓).
- **Rendimiento**: compresión gzip para texto y caché de 7 días para imágenes, SVG y vendor. Se retiraron copias de seguridad y capturas de prueba.
