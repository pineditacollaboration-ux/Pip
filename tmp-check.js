import { renderProfile } from './src/profile-page.js';

const html = renderProfile({
  username: 'pineda',
  accent: '#7DD3FC',
  background: 'aurora',
  links: [],
  badges: [{ name: 'Premium', desc: 'Plan activo.', rarity: 'Exclusiva', style: 'fundador', icon: '<path d="M2 2h20v20H2z" />' }],
});
console.log('HAS_TITLE', /title="Premium: Plan activo\./.test(html));
console.log('HAS_RARITY', /class="bdg-rarity">Exclusiva/.test(html));
console.log('HAS_GRID', /class="bd-grid" role="list"/.test(html));
console.log('HAS_HEADER', /Logros conseguidos/.test(html));
console.log('HAS_BDG_CSS', /\.bdg\s*\{[^}]*width:\s*48px/.test(html));
console.log('HAS_BDG_DESC', /\.bdg-desc\{display:none\}/.test(html));
const pos = html.indexOf('title=');
console.log('SNIP', pos >= 0 ? html.slice(Math.max(0, pos - 80), pos + 180) : 'NO_TITLE');
