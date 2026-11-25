#!/usr/bin/env node
/**
 * npm run check:wolof            → auto-tests du validateur + vérification des leçons
 * npm run check:wolof -- --strict  → les avertissements font aussi échouer
 * npm run check:wolof -- --legacy  → ajoute l'audit (informatif) de src/data/mockLessons.ts
 * npm run check:wolof -- --audio   → liste chaque fichier audio attendu et encore manquant
 * npm run check:wolof -- --update-ids        → fige les nouveaux identifiants de phrases
 * npm run check:wolof -- --retire=<id>[,<id>] → abandonne définitivement des identifiants figés
 *
 * Lancé automatiquement avant `npm run build` (script « prebuild ») : une
 * erreur bloque le build. Le code TypeScript est chargé via Vite pour
 * réutiliser l'alias « @/ ». Seuls --update-ids et --retire écrivent un
 * fichier (src/data/lessons/phrase-ids.lock.json).
 */
import { createServer } from 'vite';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const legacy = args.has('--legacy');
const listAudio = args.has('--audio');
const updateIds = args.has('--update-ids');
const retireArg = [...args].find((a) => a.startsWith('--retire='))?.slice('--retire='.length);

const LOCK_PATH = path.join(root, 'src', 'data', 'lessons', 'phrase-ids.lock.json');
function writeLock(lock) {
  const content = {
    _lisezmoi:
      'Identifiants de phrases figés : clé de la progression des apprenants et des fichiers audio. Ne pas éditer à la main : npm run check:wolof -- --update-ids (ajouter) ou --retire=<id> (abandonner définitivement).',
    phrases: lock.phrases,
    retired: lock.retired,
  };
  writeFileSync(LOCK_PATH, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.webm']);

/** Tous les fichiers sous public/audio, en chemins servis (« /audio/… »). */
function listAudioFiles() {
  const base = path.join(root, 'public', 'audio');
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push({ url: '/' + path.relative(path.join(root, 'public'), full).split(path.sep).join('/'), size: statSync(full).size, name: entry.name });
    }
  };
  walk(base);
  return out;
}

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const red = paint('31');
const yellow = paint('33');
const green = paint('32');
const dim = paint('2');
const bold = paint('1');

function printFinding(f) {
  const tag = f.severity === 'error' ? red('✗ ERREUR') : yellow('⚠ AVERTISSEMENT');
  console.log(`  ${tag}  ${f.where}  ${dim(`[${f.code}]`)}`);
  console.log(`      ${f.message}`);
  if (f.text !== undefined && f.start !== undefined && f.end !== undefined) {
    console.log(`      ${f.text}`);
    console.log(`      ${' '.repeat(f.start)}${(f.severity === 'error' ? red : yellow)('^'.repeat(Math.max(1, f.end - f.start)))}`);
  }
  if (f.suggestion) console.log(`      ${dim('piste :')} ${f.suggestion}`);
}

const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});

let errors = 0;
let warnings = 0;

try {
  const { runFixtures } = await server.ssrLoadModule('/src/lib/wolofOrthography.fixtures.ts');
  const { checkLessons, checkSoundCards, auditLegacyMock, checkIdLock, updateIdLock, retireIds, parseIdLock } =
    await server.ssrLoadModule('/src/lib/lessonChecks.ts');
  // Toutes les leçons, y compris celles en préparation (non publiées)
  const { lessonSources, allLessons: lessons } = await server.ssrLoadModule('/src/data/lessons/index.ts');
  const { soundCards } = await server.ssrLoadModule('/src/data/soundCards.ts');

  console.log(bold('\nWax Wolof · vérification orthographique\n'));

  // 1. Auto-tests du validateur
  const fx = runFixtures();
  const fxTotal = fx.passed + fx.failures.length;
  if (fx.failures.length === 0) {
    console.log(`${green('✓')} Auto-tests du validateur : ${fx.passed}/${fxTotal}`);
  } else {
    console.log(`${red('✗')} Auto-tests du validateur : ${fx.passed}/${fxTotal}`);
    for (const f of fx.failures) console.log(`    « ${f.text} » : ${f.problem}`);
    errors += fx.failures.length;
  }

  // 1 bis. Auto-tests de la logique de révision et des sessions
  const { runProgressFixtures } = await server.ssrLoadModule('/src/lib/progress.fixtures.ts');
  const px = runProgressFixtures();
  const pxTotal = px.passed + px.failures.length;
  if (px.failures.length === 0) {
    console.log(`${green('✓')} Auto-tests révision & sessions : ${px.passed}/${pxTotal}`);
  } else {
    console.log(`${red('✗')} Auto-tests révision & sessions : ${px.passed}/${pxTotal}`);
    for (const f of px.failures) console.log(`    ${f.name} : ${f.problem}`);
    errors += px.failures.length;
  }

  // 1 ter. Auto-tests des contrôles du registre
  const { runLessonCheckFixtures } = await server.ssrLoadModule('/src/lib/lessonChecks.fixtures.ts');
  const lx = runLessonCheckFixtures();
  const lxTotal = lx.passed + lx.failures.length;
  if (lx.failures.length === 0) {
    console.log(`${green('✓')} Auto-tests du registre des leçons : ${lx.passed}/${lxTotal}`);
  } else {
    console.log(`${red('✗')} Auto-tests du registre des leçons : ${lx.passed}/${lxTotal}`);
    for (const f of lx.failures) console.log(`    ${f.name} : ${f.problem}`);
    errors += lx.failures.length;
  }

  // 2. Leçons
  const phrases = lessons.flatMap((l) => l.phrases);
  const findings = checkLessons(lessonSources);
  const lessonErrors = findings.filter((f) => f.severity === 'error').length;
  const lessonWarnings = findings.length - lessonErrors;
  errors += lessonErrors;
  warnings += lessonWarnings;

  const published = lessons.filter((l) => l.published).length;
  const mark = lessonErrors ? red('✗') : lessonWarnings ? yellow('⚠') : green('✓');
  console.log(
    `${mark} Leçons : ${lessons.length} thèmes (${published} publiés), ${phrases.length} phrases — ${lessonErrors} erreur(s), ${lessonWarnings} avertissement(s)`,
  );
  for (const l of lessons) {
    console.log(dim(`    ${l.id} · ${l.title} (${l.phrases.length} phrases${l.published ? '' : ', en préparation'})`));
  }
  for (const f of findings) printFinding(f);

  // 2 bis. Identifiants figés (phrase-ids.lock.json)
  let lock = parseIdLock(existsSync(LOCK_PATH) ? JSON.parse(readFileSync(LOCK_PATH, 'utf8')) : null);
  const lockExisted = existsSync(LOCK_PATH);
  if (retireArg) {
    const ids = retireArg.split(',').map((s) => s.trim()).filter(Boolean);
    const r = retireIds(lessons, lock, ids);
    if (r.problems.length) {
      for (const p of r.problems) console.log(`  ${red('✗')} --retire : ${p}`);
      errors += r.problems.length;
    } else {
      lock = r.lock;
      writeLock(lock);
      console.log(`${green('✓')} Identifiants retirés définitivement : ${ids.join(', ')}`);
    }
  }
  if (updateIds) {
    if (lessonErrors > 0) {
      console.log(`  ${red('✗')} --update-ids refusé : corrige d'abord les erreurs des leçons.`);
      errors++;
    } else {
      const u = updateIdLock(lessons, lock);
      lock = u.lock;
      writeLock(lock);
      console.log(
        `${green('✓')} Identifiants figés mis à jour : ${u.added.length} ajouté(s)${u.updated.length ? `, ${u.updated.length} mis à jour (${u.updated.join(', ')})` : ''}`,
      );
    }
  }
  const lockFindings = lockExisted || updateIds ? checkIdLock(lessons, lock) : [];
  const lockErrors = lockFindings.filter((f) => f.severity === 'error').length;
  errors += lockErrors;
  warnings += lockFindings.length - lockErrors;
  const lockMark = !lockExisted && !updateIds ? yellow('⚠') : lockErrors ? red('✗') : lockFindings.length ? yellow('⚠') : green('✓');
  console.log(
    `${lockMark} Identifiants figés : ${Object.keys(lock.phrases).length} phrase(s), ${lock.retired.length} retiré(s)${
      !lockExisted && !updateIds ? ' — registre absent : lance « npm run check:wolof -- --update-ids »' : ''
    }`,
  );
  if (!lockExisted && !updateIds) warnings++;
  for (const f of lockFindings) printFinding(f);

  // 2 bis. Glossaire des sons
  const cardFindings = checkSoundCards(soundCards);
  const cardErrors = cardFindings.filter((f) => f.severity === 'error').length;
  const cardWarnings = cardFindings.length - cardErrors;
  errors += cardErrors;
  warnings += cardWarnings;
  const cardMark = cardErrors ? red('✗') : cardWarnings ? yellow('⚠') : green('✓');
  console.log(`${cardMark} Glossaire : ${soundCards.length} fiches — ${cardErrors} erreur(s), ${cardWarnings} avertissement(s)`);
  for (const f of cardFindings) printFinding(f);
  const cardDrafts = soundCards.filter((c) => c.review.note);
  for (const c of cardDrafts) console.log(dim(`    ${c.id} : ${c.review.note}`));

  // 3. Audio : fichiers manquants (informatif), vides ou orphelins (signalés)
  const { glossaryAudioUrl } = await server.ssrLoadModule('/src/data/soundCards.ts');
  const files = listAudioFiles();
  const fileByUrl = new Map(files.map((f) => [f.url, f]));
  const expected = [
    ...lessons.flatMap((l) =>
      l.phrases.flatMap((p) => [
        { url: p.audioUrl, group: l.id, label: `${p.id} · normal`, wolof: p.wolof },
        { url: p.slowAudioUrl, group: l.id, label: `${p.id} · lent`, wolof: p.wolof },
      ]),
    ),
    ...soundCards.map((c) => ({ url: glossaryAudioUrl(c.id), group: 'glossaire', label: `${c.id} · exemple`, wolof: c.exampleWolof })),
  ];
  const expectedUrls = new Set(expected.map((e) => e.url));

  const groups = [...new Set(expected.map((e) => e.group))];
  const presentCount = expected.filter((e) => fileByUrl.get(e.url)?.size > 0).length;
  console.log(`${dim('ℹ')} Audio natif : ${presentCount}/${expected.length} fichiers enregistrés ${dim('(sans fichier, l\'app l\'indique au lieu de simuler)')}`);
  for (const g of groups) {
    const items = expected.filter((e) => e.group === g);
    const ok = items.filter((e) => fileByUrl.get(e.url)?.size > 0).length;
    console.log(dim(`    public/audio/${g}/ : ${ok}/${items.length}`));
    if (listAudio) {
      for (const e of items.filter((x) => !(fileByUrl.get(x.url)?.size > 0))) {
        console.log(dim(`      manquant  public${e.url}  ← ${e.label} « ${e.wolof} »`));
      }
    }
  }

  const audioFindings = [];
  for (const e of expected) {
    const f = fileByUrl.get(e.url);
    if (f && f.size === 0) audioFindings.push({ severity: 'error', where: `public${e.url}`, code: 'audio', message: 'Fichier audio vide (0 octet).' });
  }
  for (const f of files) {
    if (f.name.startsWith('.') || f.name.toLowerCase().endsWith('.md')) continue;
    const ext = path.extname(f.name).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) {
      audioFindings.push({ severity: 'warning', where: `public${f.url}`, code: 'audio', message: `Extension inattendue « ${ext} » dans public/audio.` });
    } else if (!expectedUrls.has(f.url)) {
      audioFindings.push({
        severity: 'warning',
        where: `public${f.url}`,
        code: 'audio',
        message: 'Fichier audio orphelin : aucune phrase ni fiche n\'y fait référence (nom mal orthographié ? les noms attendus sont en .mp3).',
      });
    }
  }
  for (const f of audioFindings) {
    if (f.severity === 'error') errors++;
    else warnings++;
    printFinding(f);
  }

  // 4. Relecture
  const drafts = phrases.filter((p) => p.review.status === 'draft');
  console.log(`${dim('ℹ')} Relecture : ${drafts.length}/${phrases.length} phrases en brouillon, à faire valider par un locuteur natif`);
  for (const p of drafts.filter((x) => x.review.note)) console.log(dim(`    ${p.id} : ${p.review.note}`));

  // 5. Audit des anciennes données (n'affecte pas le résultat)
  if (legacy) {
    const { sessions, soundCards } = await server.ssrLoadModule('/src/data/mockLessons.ts');
    const old = auditLegacyMock(sessions, soundCards);
    const oldErr = old.filter((f) => f.severity === 'error').length;
    console.log(`\n${bold('Audit des anciennes données (mockLessons.ts) — informatif')}`);
    console.log(`  ${oldErr} erreur(s), ${old.length - oldErr} avertissement(s)`);
    for (const f of old) printFinding(f);
  }

  const failed = errors > 0 || (strict && warnings > 0);
  console.log(
    `\nRésultat : ${errors} erreur(s), ${warnings} avertissement(s)${strict ? ' (mode strict)' : ''} → ${failed ? red('ÉCHEC') : green('OK')}\n`,
  );
  process.exitCode = failed ? 1 : 0;
} catch (err) {
  console.error(red('Impossible de charger les leçons ou le validateur :'));
  console.error(err);
  process.exitCode = 1;
} finally {
  await server.close();
}
