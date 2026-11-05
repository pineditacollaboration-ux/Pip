// Crea un usuario de demostración "pineda". Uso: npm run seed  (solo para desarrollo)
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { openDb } from '../src/db.js';
const db = openDb();
if (db.prepare('SELECT 1 FROM users WHERE username=?').get('pineda')) { console.log('pineda ya existe'); process.exit(0); }
const pass = process.env.SEED_PASSWORD || randomBytes(9).toString('base64url');
const id = Number(db.prepare('INSERT INTO users(username,email,password_hash) VALUES(?,?,?)').run('pineda', 'pineda@example.com', bcrypt.hashSync(pass, 11)).lastInsertRowid);
db.prepare('INSERT INTO profiles(user_id,display_name,bio) VALUES(?,?,?)').run(id, 'Pineda', 'Diseño, música y creación de contenido.\nGracias por pasarte por aquí');
const ins = db.prepare('INSERT INTO links(user_id,label,url,position) VALUES(?,?,?,?)');
[['Instagram', 'https://instagram.com'], ['Canal de YouTube', 'https://youtube.com'], ['Mi portafolio', 'https://example.com'], ['Escríbeme', 'mailto:pineda@example.com'].slice(0, 0) || []].filter((x) => x.length).forEach(([l, u], i) => ins.run(id, l, u, i));
console.log(`Listo. Usuario: pineda  Contraseña: ${pass}  → abre /pineda`);
