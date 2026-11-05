import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from './env.js';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
// Carga la .env del proyecto y sobrescribe cualquier valor ya presente en el entorno del proceso.
loadProjectEnv(envPath);
if (!process.env.PINEDA_USER_ID || !process.env.PINEDA_DISCORD_ID) throw new Error('Configura los identificadores de la cuenta existente de Pineda antes de iniciar.');
if (process.env.NODE_ENV === 'production' && !/^https:\/\//.test(process.env.PUBLIC_URL || '')) throw new Error('PUBLIC_URL debe usar HTTPS en producción.');
const { createApp } = await import('./app-factory.js');
const { openDb } = await import('./db.js');
const { initDiscordPresenceBot } = await import('./discord-bot.js');

if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) {
  initDiscordPresenceBot(process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_GUILD_ID);
}

const port = Number(process.env.PORT || 3000);
createApp(openDb()).listen(port, () => console.log(`pip escuchando en http://localhost:${port}`));
