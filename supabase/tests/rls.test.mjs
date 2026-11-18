import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = process.argv[2] ?? fileURLToPath(new URL('../migrations', import.meta.url));
const db = new PGlite();
const stub = `
create role anon nologin; create role authenticated nologin;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema public, auth, storage to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
grant all on storage.objects to anon, authenticated;
`;
await db.exec(stub);
for (const f of fs.readdirSync(dir).sort()) {
  try { await db.exec(fs.readFileSync(`${dir}/${f}`, 'utf8')); console.log('OK', f); }
  catch (e) { console.log('FAIL', f, e.message); process.exit(1); }
}
// re-run for idempotency
for (const f of fs.readdirSync(dir).sort()) {
  try { await db.exec(fs.readFileSync(`${dir}/${f}`, 'utf8')); } catch (e) { console.log('NOT IDEMPOTENT', f, e.message); }
}
const ADMIN='11111111-1111-1111-1111-111111111111', USER='22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users values ('${ADMIN}','a@x.com'),('${USER}','u@x.com'); insert into admin_users(user_id) values ('${ADMIN}');`);
const cat = (await db.query(`select id from project_categories where slug='commercials'`)).rows[0].id;
await db.exec(`insert into projects(title,slug,category_id,is_published) values ('Pub','pub','${cat}',true),('Draft','draft','${cat}',false);`);
let pass=0, fail=0;
async function as(role, sub, sql) {
  await db.exec('reset role');
  await db.exec(`select set_config('request.jwt.claim.sub','${sub ?? ''}',false)`);
  await db.exec(`set role ${role}`);
  try { const r = await db.query(sql); return { ok: true, rows: r.rows, n: r.affectedRows }; }
  catch (e) { return { ok: false, err: e.message }; }
  finally { await db.exec('reset role'); }
}
function check(name, cond) { if (cond) pass++; else fail++; console.log(cond ? '  ✓' : '  ✗', name); }
let r;
r = await as('anon', null, `select slug from projects`); check('anon sees only published', r.ok && r.rows.length===1 && r.rows[0].slug==='pub');
r = await as('authenticated', USER, `select slug from projects`); check('non-admin user sees only published', r.ok && r.rows.length===1);
r = await as('authenticated', ADMIN, `select slug from projects`); check('admin sees drafts', r.ok && r.rows.length===2);
r = await as('anon', null, `insert into projects(title,slug) values ('x','x')`); check('anon cannot insert project', !r.ok);
r = await as('authenticated', USER, `insert into projects(title,slug) values ('x','x')`); check('user cannot insert project', !r.ok);
r = await as('authenticated', USER, `update projects set title='h' where slug='pub'`); check('user update affects 0 rows', r.ok && r.n===0);
r = await as('authenticated', ADMIN, `insert into projects(title,slug) values ('New','new')`); check('admin can insert project', r.ok);
r = await as('authenticated', ADMIN, `update projects set is_published=true where slug='new' returning published_at`); check('admin publish sets published_at', r.ok && r.rows[0]?.published_at);
r = await as('authenticated', ADMIN, `delete from projects where slug='new'`); check('admin can delete', r.ok && r.n===1);
r = await as('authenticated', ADMIN, `insert into projects(title,slug,video_source) values ('Bad','bad','upload')`); check('video consistency constraint', !r.ok);
r = await as('authenticated', ADMIN, `insert into projects(title,slug) values ('Bad','Bad Slug')`); check('slug format constraint', !r.ok);
r = await as('anon', null, `insert into contact_messages(full_name,email,project_type,budget_range,message) values ('Jo Doe','jo@x.com','Commercial','5k','Hello there, a project.')`); check('anon can submit contact', r.ok);
r = await as('anon', null, `insert into contact_messages(full_name,email,project_type,budget_range,message,is_read) values ('Jo Doe','jo@x.com','Commercial','5k','Hello there, a project.',true)`); check('anon cannot pre-mark read', !r.ok);
r = await as('anon', null, `insert into contact_messages(full_name,email,project_type,budget_range,message) values ('J','bad','C','5k','short')`); check('contact constraints reject junk', !r.ok);
r = await as('anon', null, `select * from contact_messages`); check('anon cannot read messages', !r.ok || r.rows.length===0);
r = await as('authenticated', USER, `select * from contact_messages`); check('user cannot read messages', r.ok && r.rows.length===0);
r = await as('authenticated', ADMIN, `select * from contact_messages`); check('admin reads messages', r.ok && r.rows.length===1);
r = await as('authenticated', ADMIN, `update contact_messages set is_read=true`); check('admin marks read', r.ok && r.n===1);
r = await as('anon', null, `select * from website_settings`); check('anon reads settings', r.ok && r.rows.length===1);
r = await as('anon', null, `update website_settings set site_name='hack'`); check('anon cannot update settings', !r.ok || r.n===0);
r = await as('authenticated', USER, `update profiles set full_name='hack'`); check('user cannot update profile', r.ok && r.n===0);
r = await as('authenticated', ADMIN, `update profiles set full_name='Real Name'`); check('admin updates profile', r.ok && r.n===1);
r = await as('authenticated', USER, `insert into admin_users values ('${USER}')`); check('user cannot self-promote', !r.ok);
r = await as('authenticated', USER, `select * from admin_users`); check('user sees no admin rows', r.ok && r.rows.length===0);
r = await as('authenticated', USER, `select is_admin() a`); check('is_admin false for user', r.rows?.[0]?.a===false);
r = await as('authenticated', ADMIN, `select is_admin() a`); check('is_admin true for admin', r.rows?.[0]?.a===true);
r = await as('authenticated', USER, `insert into storage.objects(bucket_id,name) values ('project-videos','x.mp4')`); check('user cannot upload', !r.ok);
r = await as('anon', null, `insert into storage.objects(bucket_id,name) values ('project-videos','x.mp4')`); check('anon cannot upload', !r.ok);
r = await as('authenticated', ADMIN, `insert into storage.objects(bucket_id,name) values ('project-videos','x.mp4')`); check('admin can upload', r.ok);
r = await as('anon', null, `select * from storage.objects`); check('anon cannot list objects', r.ok && r.rows.length===0);
r = await as('authenticated', ADMIN, `delete from storage.objects where name='x.mp4'`); check('admin can delete object', r.ok && r.n===1);
r = await as('anon', null, `select count(*)::int c from project_categories`); check('8 categories seeded', r.rows?.[0]?.c===8);
r = await as('authenticated', ADMIN, `update projects set is_demo=true, gallery='["https://x/y.jpg"]', services='{Editing}' where slug='pub' returning is_demo`); check('admin sets demo fields', r.ok && r.rows[0]?.is_demo===true);
r = await as('authenticated', USER, `update projects set is_demo=false where slug='pub'`); check('user cannot change demo flag', r.ok && r.n===0);
r = await as('anon', null, `select is_demo, gallery, services from projects where slug='pub'`); check('anon reads demo fields of published', r.ok && r.rows.length===1 && r.rows[0].is_demo===true);
r = await as('authenticated', ADMIN, `update projects set gallery='{}'::jsonb where slug='pub'`); check('gallery must be array', !r.ok);
r = await as('authenticated', ADMIN, `update profiles set workflow='[{"title":"a","description":"b"}]', highlights='[{"label":"x","value":"y"}]', tagline='t'`); check('admin sets about fields', r.ok && r.n===1);
r = await as('authenticated', USER, `update website_settings set demo_mode=true`); check('user cannot toggle demo mode', r.ok && r.n===0);
r = await as('authenticated', ADMIN, `update website_settings set demo_mode=true`); check('admin toggles demo mode', r.ok && r.n===1);
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
