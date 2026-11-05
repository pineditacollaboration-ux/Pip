# Seguridad de la instancia privada

Revisión: 29 de octubre de 2026.

## Aplicado
- Acceso vinculado a PINEDA_USER_ID y PINEDA_DISCORD_ID, además del nombre pineda. Ambos identificadores corresponden a la cuenta existente; se configuraron en .env, excluido de Git.
- Registro y confirmación de registros cerrados de forma permanente, incluso con una base vacía. Otras cuentas existentes tampoco pueden usar sesiones o iniciar sesión.
- OAuth solo solicita identify y valida el identificador antes de modificar datos o iniciar sesión. Se conserva la vinculación existente; no se unen usuarios automáticamente a servidores.
- Dashboard protegido en servidor, sin rutas HTML estáticas que eviten la autenticación. Las API autenticadas y el perfil dinámico no se almacenan en caché.
- Cookies HttpOnly, SameSite=Lax y Secure en producción. Revocación de las otras sesiones desde Cuenta. La cuenta propietaria no se elimina desde la web.
- Comprobación exacta de Origin y Fetch Metadata en operaciones de escritura. Los clientes de API deben indicar el origen PUBLIC_URL.
- CSP sin unsafe-inline para scripts, sin controladores de eventos inline; nonce ligado a la sesión para mantener la vista previa aislada. Bloqueo de objetos y restricciones de base, formularios y marcos.
- Proxy remoto de avatares retirado. No quedan descargas arbitrarias del servidor en esa ruta.
- Cargas con límites de bytes, comprobación de firmas y eliminación limitada al directorio del propietario. Se rechazan cuerpos comprimidos. Nunca se aceptan SVG o HTML como cargas.
- Límite de peticiones, validación de enlaces y respuesta genérica de errores. Fórmulas neutralizadas en exportaciones CSV.
- body-parser actualizado a una versión corregida. Auditoría npm: cero vulnerabilidades conocidas en las dependencias instaladas en esta revisión (dependency-audit.json).

## Verificado
22 pruebas seleccionadas: private-security, creator-features, dashboard-script, visits y supabase-errors. OAuth se prueba con respuestas simuladas, sin iniciar sesión en una cuenta real nueva. Verificación visual de todas las secciones, guardado y vista previa en el navegador. Perfil probado a 390 px.

Con la clave anónima de Supabase, las siete tablas no devolvieron filas visibles mediante consultas HEAD. Esto verifica lectura anónima en ese momento, no demuestra que todas las políticas de escritura sean correctas.

## Pendiente de infraestructura
Ejecutar scripts/private-database.sql desde el SQL Editor de Supabase con acceso administrativo y revisar las políticas/funciones existentes. El script habilita RLS y revoca acceso de anon y authenticated a las siete tablas de esta aplicación. El servidor usa exclusivamente SUPABASE_SERVICE_KEY. No se ejecutó porque no hay conexión SQL administrativa configurada.

Antes de publicar: usar HTTPS y NODE_ENV=production, definir PUBLIC_URL con el dominio real, conservar .env fuera del repositorio y de public/, revisar copias de seguridad y limitar el acceso de red/administración del alojamiento. El servidor rechaza PUBLIC_URL sin HTTPS en producción. Configurar proxy e IP real según el alojamiento antes de cambiar trust proxy. El límite de peticiones actual vive en un solo proceso: despliegues con varias réplicas necesitan un almacén compartido o limitación en el proxy.

El recuento deduplica recargas por cookie, perfil y día; no es identificación humana ni protección completa contra bots. Los incrementos agregados de visitas/clics aún usan lectura y escritura separadas y requieren operaciones SQL atómicas antes de operar con alta concurrencia.

Referencias: https://expressjs.com/advanced/best-practice-security/ ; https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html ; https://supabase.com/docs/guides/database/postgres/row-level-security
