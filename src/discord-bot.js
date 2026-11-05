import { Client, GatewayIntentBits, ActivityType } from 'discord.js';

let botClient = null;

const ACTIVITIES = [
  { type: ActivityType.Listening, name: 'pip.lol' },
  { type: ActivityType.Watching,  name: 'code by pineda' },
];

function rotatePresence(client) {
  let i = 0;
  const set = () => {
    const act = ACTIVITIES[i % ACTIVITIES.length];
    client.user.setPresence({
      status: 'online',
      activities: [{ type: act.type, name: act.name }],
    });
    i++;
  };
  set();
  setInterval(set, 15_000);
}

export function initDiscordPresenceBot(token, guildId) {
  if (!token || !guildId || botClient) return botClient;

  botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
    ]
  });

  botClient.on('clientReady', () => {
    console.log(`[Discord Bot] Conectado al Gateway como ${botClient.user.tag}`);
    rotatePresence(botClient);
  });

  // Track live presence updates pushed by Discord Gateway in real time
  botClient.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence?.guild) return;
    newPresence.guild.presences.cache.set(newPresence.userId, newPresence);
  });

  botClient.on('error', (err) => {
    console.warn('[Discord Bot] Error en Gateway:', err?.message || err);
  });

  botClient.login(token).catch((err) => {
    console.warn('[Discord Bot] Error al iniciar sesión en Gateway:', err?.message || err);
  });

  return botClient;
}

export async function getUserPresence(userId, guildId) {
  const unavailable = (state) => ({ status: null, activity: null, spotify: null, sampledAt: Date.now(), diagnostics: { state } });
  if (!guildId) return unavailable('configuration_missing');
  if (!botClient?.isReady()) return unavailable('bot_disconnected');
  try {
    const guild = botClient.guilds.cache.get(guildId) || await botClient.guilds.fetch(guildId).catch(() => null);
    if (!guild) return unavailable('server_unavailable');
    
    // Presence is Gateway state. Member REST requests do not refresh activities.
    const presence = guild.presences.cache.get(userId) || null;
    if (!presence) return unavailable('presence_unavailable');
    const activities = presence.activities || [];
    const spotifyActivity = activities.find((activity) => activity.name === 'Spotify' && activity.type === ActivityType.Listening);
    const spotifyImage = spotifyActivity?.assets?.largeImage;
    const spotify = spotifyActivity ? {
      title: spotifyActivity.details || '',
      artist: spotifyActivity.state || '',
      album: spotifyActivity.assets?.largeText || '',
      image: typeof spotifyImage === 'string'
        ? spotifyImage.startsWith('spotify:') ? `https://i.scdn.co/image/${spotifyImage.slice(8)}`
          : spotifyImage.startsWith('https://') ? spotifyImage : null
        : null,
      syncId: spotifyActivity.syncId || null,
      timestamps: spotifyActivity.timestamps ? {
        start: spotifyActivity.timestamps.start ? new Date(spotifyActivity.timestamps.start).getTime() : null,
        end: spotifyActivity.timestamps.end ? new Date(spotifyActivity.timestamps.end).getTime() : null,
      } : null,
    } : null;
    const formatAssetUrl = (appId, assetId) => {
      if (!assetId) return null;
      if (assetId.startsWith('mp:')) return `https://media.discordapp.net/${assetId.slice(3)}`;
      if (assetId.startsWith('https://')) return assetId;
      if (appId) return `https://cdn.discordapp.com/app-assets/${appId}/${assetId}.png`;
      return null;
    };

    const rawAct = activities.find((item) => item !== spotifyActivity && item.type !== ActivityType.Custom && item.name);
    let activity = null;
    if (rawAct) {
      const typeLabel = rawAct.type === ActivityType.Streaming ? 'Transmitiendo'
        : rawAct.type === ActivityType.Listening ? 'Escuchando'
        : rawAct.type === ActivityType.Watching ? 'Viendo'
        : rawAct.type === ActivityType.Competing ? 'Compitiendo en'
        : 'Jugando a';

      const largeImg = formatAssetUrl(rawAct.applicationId, rawAct.assets?.largeImage);
      const smallImg = formatAssetUrl(rawAct.applicationId, rawAct.assets?.smallImage);

      activity = {
        name: rawAct.name,
        type: rawAct.type,
        typeLabel,
        details: rawAct.details || '',
        state: rawAct.state || '',
        url: rawAct.url || null, // Twitch / YouTube stream URL
        largeImage: largeImg,
        largeText: rawAct.assets?.largeText || '',
        smallImage: smallImg,
        smallText: rawAct.assets?.smallText || '',
        timestamps: rawAct.timestamps ? {
          start: rawAct.timestamps.start ? new Date(rawAct.timestamps.start).getTime() : null,
          end: rawAct.timestamps.end ? new Date(rawAct.timestamps.end).getTime() : null,
        } : null
      };
    }

    return {
      sampledAt: Date.now(),
      status: presence.status || 'offline',
      activity,
      spotify,
      diagnostics: { state: 'available' },
    };
  } catch (error) {
    console.warn('[Discord Bot] No se pudo consultar la presencia:', error?.message || error);
    return unavailable('query_failed');
  }
}
