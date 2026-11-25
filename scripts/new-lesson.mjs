#!/usr/bin/env node
/**
 * Crée le squelette d'un nouveau thème, sans aucune phrase inventée :
 *
 *   npm run new:lesson -- 04 transports "Transports"
 *   npm run new:lesson -- 05 vie-quotidienne "Vie quotidienne" --prefix=quotidien
 *
 * - src/data/lessons/04-transports.ts  (published: false → invisible dans l'app)
 * - public/audio/04-transports/        (dossier des enregistrements)
 *
 * Refuse un numéro, un identifiant ou un préfixe déjà pris. N'écrase rien.
 */
import { createServer } from 'vite';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const prefixArg = argv.find((a) => a.startsWith('--prefix='))?.slice('--prefix='.length);
const [num, slug, ...titleParts] = argv.filter((a) => !a.startsWith('--'));
const title = titleParts.join(' ').trim();

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  console.error(`✗ ${message}`);
  console.error('  Usage : npm run new:lesson -- <NN> <slug> "<Titre>" [--prefix=<préfixe des phrases>]');
  process.exit(1);
}

if (!/^\d{2}$/.test(num ?? '')) fail('Numéro attendu sur deux chiffres (ex. 04).');
if (!SLUG_RE.test(slug ?? '')) fail('Slug attendu en minuscules sans accents, mots séparés par des tirets (ex. vie-quotidienne).');
if (!title) fail('Titre manquant (entre guillemets).');
const prefix = prefixArg ?? slug;
if (!SLUG_RE.test(prefix)) fail(`Préfixe « ${prefix} » invalide.`);

const id = `${num}-${slug}`;
const order = Number(num);
const file = path.join(root, 'src', 'data', 'lessons', `${id}.ts`);
const audioDir = path.join(root, 'public', 'audio', id);

const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { allLessons, lessonSources } = await server.ssrLoadModule('/src/data/lessons/index.ts');
  const clash =
    (existsSync(file) && `le fichier ${path.relative(root, file)} existe déjà`) ||
    (lessonSources.some((s) => s.file.startsWith(`${num}-`)) && `le numéro ${num} est déjà utilisé`) ||
    (allLessons.some((l) => l.order === order) && `l'ordre ${order} est déjà utilisé`) ||
    (allLessons.some((l) => l.phrasePrefix === prefix) && `le préfixe « ${prefix} » est déjà utilisé (choisis-en un autre avec --prefix=…)`);
  if (clash) fail(`Impossible de créer ${id} : ${clash}.`);

  const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const content = `import type { Lesson } from '@/data/lessons/types';

const ID = '${id}';

/**
 * Thème en préparation : « published: false » le garde hors de l'app, mais
 * \`npm run check:wolof\` (et donc le build) vérifie déjà son orthographe et ses
 * identifiants.
 *
 * Ajouter une phrase (importer aussi \`audioFor\` et \`DRAFT\` depuis
 * '@/data/lessons/types') :
 *
 *   {
 *     id: '${prefix}-01',          // définitif : ne jamais le renommer ni le réutiliser
 *     wolof: '…',                  // orthographe officielle, à faire relire
 *     french: '…',
 *     situation: '…',
 *     pronunciationNote: '…',      // sons, longueurs, rythme : concret
 *     ...audioFor(ID, '${prefix}-01'),
 *     review: DRAFT,               // 'reviewed' après relecture par un locuteur natif
 *   },
 *
 * Puis :
 *   1. npm run check:wolof                 → corriger les erreurs signalées
 *   2. relecture native, review: { status: 'reviewed' }
 *   3. npm run check:wolof -- --update-ids → figer les identifiants
 *   4. ${'≥'} 6 phrases et un résumé → published: true
 */
const lesson: Lesson = {
  id: ID,
  order: ${order},
  phrasePrefix: ${quote(prefix)},
  published: false,
  title: ${quote(title)},
  summary: '',
  phrases: [],
};

export default lesson;
`;

  writeFileSync(file, content, 'utf8');
  mkdirSync(audioDir, { recursive: true });
  if (!existsSync(path.join(audioDir, '.gitkeep'))) writeFileSync(path.join(audioDir, '.gitkeep'), '');

  console.log(`✓ Thème créé : ${path.relative(root, file)}`);
  console.log(`✓ Dossier audio : ${path.relative(root, audioDir)}`);
  console.log(`  Préfixe des phrases : ${prefix}-01, ${prefix}-02…`);
  console.log('  Le thème reste invisible dans l\'app tant que « published » vaut false.');
} finally {
  await server.close();
}
