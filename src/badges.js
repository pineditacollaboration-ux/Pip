import ICONS from './badge-icons.json' with { type: 'json' };
import GRANTS from './badge-grants.json' with { type: 'json' };

// Cosmetic distinctions only. They never grant account or system permissions.
export const BADGES = [
  {"id":"owner","n":"Propietario","d":"Custodia y dirige la plataforma.","i":"crown","tier":"oro"},
  {"id":"architect","n":"Arquitecto","d":"Diseñó y construyó pip desde cero.","i":"cube","tier":"plata"},
  {"id":"origin","n":"Origen","d":"La cuenta desde la que empezó todo.","i":"zap","tier":"celeste"},
  {"id":"lifetime","n":"Permanente","d":"Acceso completo, sin fecha de vencimiento.","i":"infinity","tier":"oro"},
  {"id":"creative-director","n":"Dirección creativa","d":"Define la identidad y el lenguaje visual de pip.","i":"feather","tier":"plata"},
  {"id":"first-release","n":"Primera edición","d":"Presente desde el primer lanzamiento público.","i":"rocket","tier":"celeste"},
  { id: 'fundador', n: 'Fundador', d: 'Fundador de pip y de su comunidad.', i: 'crown', tier: 'oro' },
  { id: 'verificado', n: 'Verificado', d: 'Identidad reconocida por el equipo de pip.', i: 'user-round', tier: 'celeste' },
  { id: 'developer', n: 'Código', d: 'Desarrolla y mantiene el proyecto pip.', i: 'code', tier: 'plata' },
  { id: 'system-admin', n: 'Núcleo', d: 'Administración principal del sistema.', i: 'shield', tier: 'plata' },
  { id: 'og', n: 'OG', d: 'Miembro de la primera generación, desde los orígenes del proyecto.', i: 'award', tier: 'oro' },
  { id: 'premium', n: 'Creador', d: 'Membresía de creador activa.', i: 'diamond', tier: 'oro' },
  { id: 'contributor', n: 'Aportación', d: 'Contribuciones destacadas al proyecto o la comunidad.', i: 'spark', tier: 'celeste' },
  { id: 'partner', n: 'Alianza', d: 'Colaboración oficial con pip.', i: 'link', tier: 'plata' },
];
export const RARITY = { celeste: 'Especial', plata: 'Distinción', oro: 'Exclusiva' };
export const styleOf = (id, tier) => id === 'fundador' ? 'fundador' : tier;
export const rarityOf = (id, tier) => id === 'fundador' ? 'Fundador' : RARITY[tier];
export function evalBadges(x, grants = GRANTS, now = Date.now()) {
  const grant = grants[String(x.username || '').toLowerCase()] || {};
  return BADGES.map(b => ({
    id: b.id, name: b.n, desc: b.d, tier: b.tier, style: styleOf(b.id, b.tier),
    rarity: rarityOf(b.id, b.tier), icon: ICONS[b.i] || '',
    earned: b.id === 'premium' ? (grant.plan === 'creator' || (Number.isFinite(Date.parse(grant.premiumUntil)) && Date.parse(grant.premiumUntil) > now)) : (grant.badges || []).includes(b.id),
    progress: null, goal: null,
  }));
}
