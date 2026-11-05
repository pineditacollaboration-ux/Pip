import * as si from 'simple-icons';
import { readFileSync, writeFileSync } from 'node:fs';
// slug: [nombre, categoria, base de URL, dominios]
const want = {
  instagram:['Instagram','Social','https://instagram.com/',['instagram.com']], x:['X','Social','https://x.com/',['x.com','twitter.com']], tiktok:['TikTok','Social','https://tiktok.com/@',['tiktok.com']],
  threads:['Threads','Social','https://threads.net/@',['threads.net']], facebook:['Facebook','Social','https://facebook.com/',['facebook.com','fb.com']], snapchat:['Snapchat','Social','https://snapchat.com/add/',['snapchat.com']],
  reddit:['Reddit','Social','https://reddit.com/user/',['reddit.com']], bluesky:['Bluesky','Social','https://bsky.app/profile/',['bsky.app']], pinterest:['Pinterest','Social','https://pinterest.com/',['pinterest.com']],
  discord:['Discord','Social','https://discord.gg/',['discord.gg','discord.com']], youtube:['YouTube','Vídeo','https://youtube.com/@',['youtube.com','youtu.be']], twitch:['Twitch','Vídeo','https://twitch.tv/',['twitch.tv']], kick:['Kick','Vídeo','https://kick.com/',['kick.com']],
  spotify:['Spotify','Música','https://open.spotify.com/user/',['spotify.com']], soundcloud:['SoundCloud','Música','https://soundcloud.com/',['soundcloud.com']],
  steam:['Steam','Gaming','https://steamcommunity.com/id/',['steamcommunity.com','steampowered.com']], roblox:['Roblox','Gaming','https://roblox.com/users/',['roblox.com']], playstation:['PlayStation','Gaming','https://psnprofiles.com/',['playstation.com']], epicgames:['Epic Games','Gaming','https://store.epicgames.com/',['epicgames.com']],
  github:['GitHub','Dev','https://github.com/',['github.com']], patreon:['Patreon','Apoyo','https://patreon.com/',['patreon.com']], kofi:['Ko-fi','Apoyo','https://ko-fi.com/',['ko-fi.com']],
  telegram:['Telegram','Contacto','https://t.me/',['t.me','telegram.org']], whatsapp:['WhatsApp','Contacto','https://wa.me/',['whatsapp.com','wa.me']] };
const out = {};
for (const [slug,[n,c,b,hosts]] of Object.entries(want)) { const i = si['si'+slug[0].toUpperCase()+slug.slice(1)]; if (i) out[slug] = { n, c, b, p: i.path, h: i.hex, hosts }; }
writeFileSync(new URL('../src/icons.json', import.meta.url), JSON.stringify(out));
// iconos de insignias: ver scripts/gen-badge-icons.py (iconos propios, ya no se generan desde lucide)
console.log('plataformas', Object.keys(out).length);
