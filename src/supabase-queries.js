// Adaptador asíncrono para Supabase
export function createQueries(sb) {
  const check = ({ error }) => { if (error) throw error; };
  const read = ({ data, error }) => { if (error) throw error; return data; };
  return {
    async userByName(username) {
      return read(await sb.from('users').select('*').ilike('username', username).maybeSingle());
    },
    async userByEmail(email) {
      return read(await sb.from('users').select('*').ilike('email', email).maybeSingle());
    },
    async userById(id) {
      return read(await sb.from('users').select('*').eq('id', id).maybeSingle());
    },
    async userByDiscord(discordId) {
      return read(await sb.from('users').select('*').eq('discord_id', String(discordId)).maybeSingle());
    },
    async firstUser() {
      return read(await sb.from('users').select('*').order('created_at', { ascending: true }).limit(1).maybeSingle());
    },
    async insUser(username, email, password_hash) {
      const { data, error } = await sb.from('users').insert({ username, email, password_hash }).select('id').single();
      if (error) throw error;
      return { lastInsertRowid: data.id };
    },
    async insDiscordUser(username, email, password_hash, discord_id, discord_name, discord_avatar, discord_banner, discord_decoration) {
      const { data, error } = await sb.from('users').insert({
        username, email, password_hash, discord_id: String(discord_id), discord_name, discord_avatar, discord_banner, discord_decoration
      }).select('id').single();
      if (error) throw error;
      return { lastInsertRowid: data.id };
    },
    async updDiscord(name, av, bn, deco, id) {
      check(await sb.from('users').update({ discord_name: name, discord_avatar: av, discord_banner: bn, discord_decoration: deco }).eq('id', id));
    },
    async delUser(id) {
      check(await sb.from('users').delete().eq('id', id));
    },
    async countUsers() {
      const { count, error } = await sb.from('users').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },

    // Sesiones
    async insSession(token_hash, user_id, expires_at) {
      check(await sb.from('sessions').upsert({ token_hash, user_id, expires_at }));
    },
    async delSession(token_hash) {
      check(await sb.from('sessions').delete().eq('token_hash', token_hash));
    },
    async session(token_hash) {
      const now = Math.floor(Date.now() / 1000);
      const data = read(await sb.from('sessions')
        .select('users(id, username, email, discord_id), expires_at')
        .eq('token_hash', token_hash)
        .gt('expires_at', now)
        .maybeSingle());
      return data?.users || null;
    },

    // Perfiles
    async insProfile(user_id, display_name) {
      check(await sb.from('profiles').upsert({ user_id, display_name }));
    },
    async profile(user_id) {
      const data = read(await sb.from('profiles').select('*').eq('user_id', user_id).maybeSingle());
      if (!data) return {};
      return {
        ...data,
        settings: data.settings
      };
    },
    async updProfile(display_name, bio, accent, background, bg_blur, bg_opacity, bg_vignette, particles, splash, splash_text, user_id) {
      check(await sb.from('profiles').update({
        display_name, bio, accent, background, bg_blur, bg_opacity, bg_vignette, particles, splash, splash_text
      }).eq('user_id', user_id));
    },
    async setSettings(settingsJson, user_id) {
      let parsed = {};
      try { parsed = JSON.parse(settingsJson); } catch {}
      check(await sb.from('profiles').update({ settings: parsed }).eq('user_id', user_id));
    },
    async setMedia(col, val, user_id) {
      check(await sb.from('profiles').update({ [col]: val }).eq('user_id', user_id));
    },

    // Enlaces
    async links(user_id) {
      const data = read(await sb.from('links').select('*').eq('user_id', user_id).order('position', { ascending: true }).order('id', { ascending: true }));
      return data || [];
    },
    async countLinks(user_id) {
      const { count } = await sb.from('links').select('*', { count: 'exact', head: true }).eq('user_id', user_id).then((r) => { if (r.error) throw r.error; return r; });
      return { n: count || 0 };
    },
    async insLink(user_id, label, url, position) {
      const { data, error } = await sb.from('links').insert({ user_id, label, url, position }).select('id').single();
      if (error) throw error;
      return data;
    },
    async updLink(id, user_id, label, url) {
      check(await sb.from('links').update({ label, url }).eq('id', id).eq('user_id', user_id));
    },
    async delLink(id, user_id) {
      check(await sb.from('links').delete().eq('id', id).eq('user_id', user_id));
    },
    async linkById(id) {
      return read(await sb.from('links').select('*').eq('id', id).maybeSingle());
    },
    async clickLink(id) {
      const l = await this.linkById(id);
      if (l) check(await sb.from('links').update({ clicks: (l.clicks || 0) + 1 }).eq('id', id));
    },

    // Analíticas
    async addVisitor(user_id, hash, day = new Date().toISOString().slice(0, 10)) {
      // The composite primary key makes repeated/concurrent visits idempotent.
      const { error } = await sb.from('visitors').insert({ user_id, day, hash });
      if (error?.code === '23505') return false;
      if (error) throw error;
      return true;
    },
    async uniq(user_id) {
      const d = new Date(); d.setDate(d.getDate() - 29);
      const limitDate = d.toISOString().slice(0, 10);
      const { count } = await sb.from('visitors').select('*', { count: 'exact', head: true }).eq('user_id', user_id).gte('day', limitDate).then((r) => { if (r.error) throw r.error; return r; });
      return { n: count || 0 };
    },
    async addHour(user_id, hour) {
      const data = read(await sb.from('hours').select('count').eq('user_id', user_id).eq('hour', hour).maybeSingle());
      if (data) {
        check(await sb.from('hours').update({ count: data.count + 1 }).eq('user_id', user_id).eq('hour', hour));
      } else {
        check(await sb.from('hours').insert({ user_id, hour, count: 1 }));
      }
    },
    async hours(user_id) {
      const data = read(await sb.from('hours').select('hour, count').eq('user_id', user_id));
      return data || [];
    },
    async addView(user_id) {
      const today = new Date().toISOString().slice(0, 10);
      const data = read(await sb.from('views').select('count').eq('user_id', user_id).eq('day', today).maybeSingle());
      if (data) {
        check(await sb.from('views').update({ count: data.count + 1 }).eq('user_id', user_id).eq('day', today));
      } else {
        check(await sb.from('views').insert({ user_id, day: today, count: 1 }));
      }
    },
    async viewsTotal(user_id) {
      const data = read(await sb.from('views').select('count').eq('user_id', user_id));
      const total = (data || []).reduce((sum, r) => sum + (r.count || 0), 0);
      return { n: total };
    },
    async viewsDays(user_id) {
      const d = new Date(); d.setDate(d.getDate() - 13);
      const limitDate = d.toISOString().slice(0, 10);
      const data = read(await sb.from('views').select('day, count').eq('user_id', user_id).gte('day', limitDate).order('day', { ascending: true }));
      return data || [];
    }
  };
}
