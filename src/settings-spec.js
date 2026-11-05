// Fuente única de verdad: el servidor valida con esto y el panel se dibuja con esto.
const T = (k, l, d, desc) => ({ k, t: 'toggle', l, d, desc });
const CH = (k, l, o, d, desc) => ({ k, t: 'chips', l, o, d, desc });
const R = (k, l, min, max, d, lo, hi, desc) => ({ k, t: 'range', l, min, max, d, lo, hi, desc });
const X = (k, l, d, desc, max = 80, ph = '') => ({ k, t: 'text', l, d, desc, max, ph });
const DT = (k, l, d, desc) => ({ k, t: 'date', l, d, desc });
const CO = (k, l, d, desc) => ({ k, t: 'color', l, d, desc });
export const SPEC = [
  { sec: 'insignias', title: 'Exhibición', items: [X('badge_hidden', 'Insignias ocultas', '', null, 200)] },
  { sec: 'widgets', title: 'Spotify y Actividad Discord', sub: 'Música, juegos y transmisiones en vivo sincronizados con Discord Gateway.', items: [
    T('spotify_show', 'Mostrar Spotify', true),
    CH('spotify_layout', 'Presentación Spotify', [['compact', 'Compacta'], ['cover', 'Portada grande']], 'compact'),
    T('discord_activity_show', 'Mostrar Juegos y Streams en vivo', true, 'Muestra en tiempo real a qué estás jugando o si estás transmitiendo en Twitch.')] },
  { sec: 'cuenta', title: 'Contador', sub: 'Cómo se muestran tus visitas.', items: [
    CH('views_style', 'Estilo del contador', [['pill', 'Etiqueta'], ['minimal', 'Discreto']], 'pill')] },
  { sec: 'perfil', title: 'Avatar', sub: 'La imagen junto a tu nombre.', items: [
    T('avatar_show', 'Mostrar avatar', true),
    CH('avatar_shape', 'Forma', [['square', 'Cuadrado'], ['rounded', 'Redondeado'], ['circle', 'Círculo']], 'circle'),
    R('avatar_size', 'Tamaño', 56, 150, 104, 'Pequeño', 'Grande'),
    CH('avatar_pos', 'Dónde va', [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha'], ['side', 'Nombre al lado']], 'center')] },
  { sec: 'perfil', title: 'Texto y Efectos', sub: 'Qué se muestra y cómo reacciona tu biografía.', items: [
    T('name_show', 'Mostrar nombre', true),
    CH('name_effect', 'Efecto del nombre', [['none', 'Normal'], ['glow', 'Neón Glow'], ['gradient', 'Degradado Vivo'], ['glitch', 'Cyber Glitch'], ['sparkle', 'Destellos'], ['shine', 'Brillo metálico']], 'none'),
    T('bio_show', 'Mostrar biografía', true),
    T('typewriter_bio', 'Efecto máquina de escribir', false, 'La biografía se escribe letra a letra al entrar.'),
    X('bio_rotate', 'Frases rotativas', '', 'Separa con | y tu biografía irá cambiando sola entre ellas.', 200, 'Programador | Creador de bots | Colombia'),
    T('badges_show', 'Mostrar insignias', false, 'Las que hayas desbloqueado.')] },
  { sec: 'diseno', title: 'La tarjeta', sub: 'La caja que envuelve todo.', items: [
    R('card_width', 'Ancho', 340, 640, 460, 'Estrecha', 'Ancha'), R('card_radius', 'Esquinas', 0, 48, 18, 'Rectas', 'Redondas'),
    R('card_bg', 'Fondo de la tarjeta', 0, 100, 12, 'Transparente', 'Sólido'), R('card_glass', 'Efecto cristal', 0, 30, 14, 'Nítido', 'Esmerilado'),
    T('card_border', 'Borde', true), R('card_border_w', 'Grosor del borde', 1, 4, 1, 'Fino', 'Grueso'),
    CH('card_anim', 'Borde animado', [['none', 'Ninguno'], ['glow', 'Pulso'], ['spin', 'Giratorio'], ['holo', 'Holográfico'], ['rainbow', 'Arcoíris']], 'none'),
    T('banner_gradient', 'Banner degradado animado', false, 'Muestra un banner con degradado de color animado cuando no tienes imagen de banner.')] },
  { sec: 'efectos', title: 'Al abrir tu perfil', sub: 'Cómo aparece la tarjeta y la pestaña.', items: [
    T('enter_on', 'Animar la entrada', true, 'La tarjeta aparece al abrir el perfil.'),
    CH('enter_type', 'Tipo', [['rise', 'Emerger'], ['fade', 'Fundido'], ['zoom', 'Zoom']], 'rise'),
    CH('enter_from', 'Desde dónde', [['bottom', 'Abajo'], ['top', 'Arriba'], ['right', 'Derecha'], ['left', 'Izquierda']], 'bottom'),
    CH('enter_speed', 'Velocidad', [['slow', 'Lenta'], ['normal', 'Normal'], ['fast', 'Rápida']], 'normal'),
    T('title_anim', 'Título animado', false, 'Tu nombre se escribe y se borra en la pestaña.'), T('tilt', 'Inclinación 3D', true, 'La tarjeta sigue al ratón.')] },
  { sec: 'efectos', title: 'Ambiente', sub: 'Lo que va encima de tu fondo.', items: [
    CH('particles_type', 'Partículas', [['none', 'Ninguna'], ['dots', 'Red'], ['snow', 'Nieve'], ['stars', 'Estrellas'], ['matrix', 'Lluvia Digital'], ['fireflies', 'Luciérnagas'], ['sakura', 'Sakura'], ['bubbles', 'Burbujas'], ['embers', 'Brasas'], ['rain', 'Lluvia'], ['galaxy', 'Polvo estelar'], ['confetti', 'Confeti']], 'none'),
    CH('screen_fx', 'Efecto de pantalla', [['none', 'Ninguno'], ['lines', 'Líneas'], ['crt', 'Tele antigua'], ['dots', 'Puntos'], ['vignette', 'Cinemático'], ['glitch', 'Glitch Cyber'], ['aurora', 'Aurora'], ['spotlight', 'Foco de luz'], ['sunset', 'Atardecer']], 'none')] },
  { sec: 'efectos', title: 'Ratón y Cursor', sub: 'Estilo de puntero, estela y sonido.', items: [
    CH('custom_cursor', 'Estilo de cursor', [['default', 'Normal'], ['crosshair', 'Cruz Cyber'], ['dot_glow', 'Punto Neón']], 'default'),
    CH('trail', 'Estela', [['none', 'Ninguna'], ['sparks', 'Chispas'], ['glow', 'Brillo'], ['stars', 'Estrellas']], 'none'), CO('trail_color', 'Color de la estela', '#F2F2F2'),
    CH('click_sound', 'Sonido al pulsar', [['none', 'Ninguno'], ['pop', 'Pop'], ['tick', 'Tic'], ['chime', 'Campanilla']], 'none')] },
  { sec: 'cuenta', title: 'Privacidad', sub: 'Qué se ve y qué se cuenta.', items: [
    T('show_views', 'Mostrar el contador de visitas', false, 'El número de veces que han abierto tu perfil.'),
    T('count_clicks', 'Contar los clics en tus enlaces', true, 'Solo un número por enlace. No se guarda quién pulsó.')] },
  { sec: 'perfil', title: 'Estado y ubicación', sub: 'Pequeños detalles que humanizan tu perfil.', items: [
    X('status_text', 'Estado', '', 'Una frase corta bajo tu nombre.', 60, 'Ej: Trabajando en algo nuevo'), X('location', 'Ubicación', '', null, 40, 'Ej: Medellín, Colombia')] },
  { sec: 'enlaces', title: 'Estilo de los enlaces', sub: 'Cómo se ven los botones en tu perfil.', items: [
    CH('link_style', 'Botones', [['glass', 'Cristal'], ['solid', 'Sólido'], ['outline', 'Contorno'], ['neon', 'Neón Glow'], ['pill', 'Píldora Esmerilada']], 'glass'),
    CH('link_cols', 'Distribución', [['1', 'Una columna'], ['2', 'Dos columnas']], '1'),
    R('link_radius', 'Redondeo', 0, 28, 10, 'Rectos', 'Píldora'), CH('link_hover', 'Efecto al pasar el ratón', [['lift', 'Elevar'], ['glow', 'Resplandor'], ['slide', 'Deslizar'], ['none', 'Ninguno']], 'lift'), T('link_icons', 'Mostrar iconos de plataforma', true)] },
  { sec: 'diseno', title: 'Tipografía', sub: 'La voz de tu nombre.', items: [
    CH('font', 'Fuente del nombre', [['sora', 'Moderna'], ['inter', 'Neutra'], ['syne', 'Editorial'], ['outfit', 'Futurista'], ['serif', 'Elegante'], ['mono', 'JetBrains Mono']], 'inter'), R('name_size', 'Tamaño del nombre', 20, 44, 30, 'Discreto', 'Grande'), R('name_spacing', 'Espacio entre letras', 0, 3, 1, 'Natural', 'Amplio')] },
  { sec: 'fondo', title: 'Textura y movimiento', sub: 'Dale vida al fondo.', items: [
    R('bg_sat', 'Saturación del fondo', 0, 200, 100, 'Apagado', 'Intenso'), R('bg_bright', 'Brillo del fondo', 40, 130, 100, 'Oscuro', 'Luminoso'),
    T('bg_zoom', 'Zoom lento del fondo', false, 'El fondo respira con un acercamiento muy suave.'),
    T('bg_noise', 'Grano de película', false, 'Una textura fina sobre el fondo.'), CH('bg_motion', 'Movimiento', [['none', 'Estático'], ['drift', 'Deriva suave']], 'none')] },
  { sec: 'efectos', title: 'Interacción', sub: 'Cómo reacciona tu perfil.', items: [
    CH('click_fx', 'Efecto al hacer clic', [['none', 'Ninguno'], ['ripple', 'Onda'], ['burst', 'Explosión']], 'none'), T('card_float', 'Flotación suave de la tarjeta', false),
    T('card_glare', 'Reflejo de luz en la tarjeta', false, 'Un brillo sigue al ratón sobre la tarjeta.'),
    T('links_stagger', 'Enlaces en cascada', true, 'Los enlaces aparecen uno tras otro al abrir el perfil.')] },
  { sec: 'widgets', title: 'Hora local', sub: 'Muestra qué hora es para ti.', items: [
    T('w_clock', 'Mostrar reloj', false), CH('w_tz', 'Zona horaria', [['America/Bogota', 'Bogotá'], ['America/Mexico_City', 'CDMX'], ['America/Argentina/Buenos_Aires', 'Buenos Aires'], ['America/New_York', 'Nueva York'], ['Europe/Madrid', 'Madrid'], ['UTC', 'UTC']], 'America/Bogota')] },
  { sec: 'widgets', title: 'Anuncio destacado', sub: 'Un aviso visible encima de tus enlaces.', items: [
    T('w_note_on', 'Mostrar anuncio', false), X('w_note', 'Mensaje', '', null, 120, 'Ej: Nuevo vídeo este viernes'), CH('w_note_tone', 'Estilo', [['info', 'Informativo'], ['hot', 'Destacado'], ['ok', 'Positivo']], 'info')] },
  { sec: 'widgets', title: 'Cuenta regresiva', sub: 'Cuenta los días hasta algo importante.', items: [
    T('w_cd_on', 'Mostrar cuenta regresiva', false), X('w_cd_label', 'Qué se cuenta', '', null, 30, 'Ej: Estreno'), DT('w_cd_date', 'Fecha')] },
  { sec: 'widgets', title: 'Social Dock', sub: 'Iconos rápidos de tus redes sociales con efecto Bento/iOS.', items: [
    T('social_dock_show', 'Mostrar Social Dock', false),
    CH('social_dock_pos', 'Posición', [['top', 'Arriba (bajo biografía)'], ['bottom', 'Abajo (fin de tarjeta)']], 'top'),
    CH('social_dock_style', 'Estilo', [['glass', 'Cristal Bento'], ['color', 'Colores Oficiales'], ['minimal', 'Monocromo']], 'glass')] },
  { sec: 'widgets', title: 'Canción destacada', sub: 'Muestra una canción que quieres destacar en tu perfil.', items: [
    T('w_song_on', 'Mostrar canción destacada', false),
    X('w_song_title', 'Título', '', null, 80, 'Ej: God\'s Plan'),
    X('w_song_artist', 'Artista', '', null, 60, 'Ej: Drake'),
    X('w_song_url', 'Enlace (Spotify, YouTube…)', '', null, 200, 'https://open.spotify.com/…'),
    X('w_song_img', 'URL de portada (imagen)', '', null, 300, 'https://…')] },
  { sec: 'widgets', title: 'Disponibilidad', sub: 'Una píldora con punto de color que dice si estás libre.', items: [
    T('w_avail_on', 'Mostrar disponibilidad', false),
    CH('w_avail_state', 'Estado', [['open', 'Disponible'], ['busy', 'Ocupado'], ['away', 'Ausente']], 'open'),
    X('w_avail_text', 'Texto', '', null, 50, 'Ej: Abierto a proyectos')] },
  { sec: 'widgets', title: 'Cita o lema', sub: 'Una frase tuya o que te inspire, con estilo editorial.', items: [
    T('w_quote_on', 'Mostrar cita', false), X('w_quote', 'Frase', '', null, 160, 'Ej: Hecho es mejor que perfecto'), X('w_quote_by', 'Autor (opcional)', '', null, 40, 'Ej: Tú')] },
  { sec: 'widgets', title: 'Botón destacado', sub: 'Una llamada a la acción grande bajo tus enlaces.', items: [
    T('w_cta_on', 'Mostrar botón destacado', false), X('w_cta_label', 'Texto del botón', '', null, 40, 'Ej: Contrátame'), X('w_cta_url', 'Enlace (https://…)', '', null, 300, 'https://…'),
    CH('w_cta_style', 'Estilo', [['solid', 'Sólido'], ['glow', 'Resplandor'], ['outline', 'Contorno']], 'solid')] },
  { sec: 'widgets', title: 'Compartir', sub: 'Facilita que otros difundan tu perfil.', items: [
    T('w_share', 'Botón de compartir en la tarjeta', false, 'Abre el menú de compartir del móvil o copia el enlace.')] },
  { sec: 'compartir', title: 'Buscadores y redes', sub: 'Qué se muestra cuando alguien comparte tu enlace.', items: [
    X('seo_desc', 'Descripción al compartir', '', 'Si la dejas vacía se usa tu biografía.', 160, 'Una frase que invite a entrar'), T('seo_noindex', 'Ocultar de buscadores', false, 'Pide a Google y otros que no indexen tu perfil.')] },
];
const ITEMS = SPEC.flatMap((s) => s.items);
export const DEFAULTS = Object.fromEntries(ITEMS.map((i) => [i.k, i.d]));
export function sanitize(input = {}, current = DEFAULTS) {
  const out = {};
  for (const i of ITEMS) {
    const has = input && Object.hasOwn(input, i.k), v = has ? input[i.k] : undefined; let r = current[i.k] ?? i.d;
    if (has) {
      if (i.t === 'toggle') r = v === true || v === 1;
      else if (i.t === 'chips') r = i.o.some(([o]) => o === v) ? v : r;
      else if (i.t === 'range') r = Number.isFinite(+v) ? Math.min(i.max, Math.max(i.min, Math.round(+v))) : r;
      else if (i.t === 'text') r = typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, i.max || 80) : r;
      else if (i.t === 'date') r = v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : r;
      else if (i.t === 'color') r = /^#[0-9a-fA-F]{6}$/.test(v) ? v : r;
    }
    // Always include the key, even if not in input (use default or current)
    out[i.k] = r;
  }
  return out;
}
export const designChanged = (s) => ITEMS.filter((i) => ['diseno', 'efectos'].includes(SPEC.find((x) => x.items.includes(i)).sec)).some((i) => s[i.k] !== i.d);
