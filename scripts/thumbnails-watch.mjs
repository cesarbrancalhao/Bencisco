/**
 * Watches src/data/*.yaml and regenerates only the thumbnails for
 * cases that actually changed.
 *
 * Connects to the running astro dev server — does NOT do its own build.
 * Launched automatically by `npm run dev` via scripts/dev.mjs.
 *
 * Usage (standalone): node scripts/thumbnails-watch.mjs [--port 4321]
 */
import { readFile, writeFile, mkdir, unlink, stat } from 'node:fs/promises';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { watch } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const OUT_DIR = join(__dirname, '..', 'public', 'thumbnails');
const CACHE_FILE = join(__dirname, '..', '.thumbnail-cache.json');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx >= 0 ? Number(args[portIdx + 1]) : 4321;
const BASE = `http://localhost:${PORT}`;

await mkdir(OUT_DIR, { recursive: true });

function hashStr(s) {
	return createHash('sha256').update(s).digest('hex');
}

function resolvePrefix(c, meta) {
	return c.preset ?? meta.family_prefixes?.[c.family ?? ''] ?? meta.setup_prefix ?? '';
}

function resolveSuffix(c, meta) {
	return c.postset ?? meta.family_suffixes?.[c.family ?? ''] ?? meta.setup_suffix ?? '';
}

function caseThumbKey(c, meta) {
	return hashStr(
		JSON.stringify({
			alg: c.alg,
			prefix: resolvePrefix(c, meta),
			suffix: resolveSuffix(c, meta),
			topDown: meta.top_down ?? false,
		}),
	);
}

function loadFiles() {
	const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.yaml'));
	const result = {};
	for (const f of files) {
		const raw = readFileSync(join(DATA_DIR, f), 'utf-8');
		const doc = parseYaml(raw);
		result[f] = doc;
	}
	return result;
}

function buildCache() {
	const allFiles = loadFiles();
	const cache = {};
	for (const [filename, doc] of Object.entries(allFiles)) {
		const meta = { ...doc };
		delete meta.cases;
		for (const c of doc.cases ?? []) {
			if (!c.id) continue;
			cache[c.id] = caseThumbKey(c, meta);
		}
	}
	return cache;
}

let cache = {};

async function loadCache() {
	try {
		cache = JSON.parse(await readFile(CACHE_FILE, 'utf-8'));
	} catch {
		cache = {};
	}
}

async function saveCache() {
	await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function screenshotCases(page, ids) {
	if (ids.length === 0) return;
	await page.goto(`${BASE}/thumbnail-renderer/`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(6000);
	const container = page.locator('[data-thumb-case]');
	const count = await container.count();
	console.log(`  page has ${count} cases rendered`);
	for (const id of ids) {
		try {
			const el = page.locator(`[data-thumb-case="${id}"]`);
			if ((await el.count()) === 0) {
				console.log(`  skip ${id} (not found on page)`);
				continue;
			}
			const png = await el.screenshot({ omitBackground: true });
			await sharp(png).webp({ quality: 85 }).toFile(`${OUT_DIR}/${id}.webp`);
			console.log(`  ${id}.webp`);
		} catch (err) {
			console.error(`  ${id} FAILED:`, err.message);
		}
	}
}

async function waitForServer(timeout = 30000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		try {
			const res = await fetch(`${BASE}/`);
			if (res.ok) return;
		} catch {}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`Dev server at ${BASE} not ready after ${timeout}ms`);
}

console.log(`Waiting for dev server at ${BASE}…`);
await waitForServer();

const browser = await chromium.launch({
	executablePath: '/usr/bin/google-chrome',
	args: ['--no-sandbox', '--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 25000 } });

// Initial full generation
await loadCache();
const newCache = buildCache();
const initialIds = Object.keys(newCache);
const allIds = [...new Set([...initialIds, ...Object.keys(cache)])];

// Find changed/new cases
const changedIds = [];
const deletedIds = [];
for (const id of allIds) {
	if (!newCache[id]) {
		deletedIds.push(id);
	} else if (newCache[id] !== cache[id]) {
		changedIds.push(id);
	}
}

if (changedIds.length > 0 || deletedIds.length > 0) {
	console.log(`Initial: ${changedIds.length} changed, ${deletedIds.length} removed`);
	for (const id of deletedIds) {
		try { await unlink(`${OUT_DIR}/${id}.webp`); } catch {}
		console.log(`  rm ${id}.webp`);
	}
	await screenshotCases(page, changedIds);
	cache = newCache;
	await saveCache();
	console.log('Initial generation done.');
} else {
	console.log('All thumbnails up to date.');
}

// Watch for changes
let debounceTimer;
const pendingFiles = new Set();

function handleChanges() {
	const files = [...pendingFiles];
	pendingFiles.clear();

	const allFiles = loadFiles();
	const newCacheFull = {};
	const fileChangedIds = new Set();

	for (const filename of files) {
		const doc = allFiles[filename];
		if (!doc) continue;
		const meta = { ...doc };
		delete meta.cases;
		for (const c of doc.cases ?? []) {
			if (!c.id) continue;
			newCacheFull[c.id] = caseThumbKey(c, meta);
			if (newCacheFull[c.id] !== cache[c.id]) {
				fileChangedIds.add(c.id);
			}
		}
	}

	// Also check for deleted cases (was in cache but not in current files)
	for (const filename of files) {
		for (const [id, hash] of Object.entries(cache)) {
			if (id.startsWith(filename.replace('.yaml', '-')) && !newCacheFull[id]) {
				fileChangedIds.add(id); // mark for deletion
			}
		}
	}

	const toUpdate = [];
	const toDelete = [];
	for (const id of fileChangedIds) {
		if (newCacheFull[id]) {
			toUpdate.push(id);
			cache[id] = newCacheFull[id];
		} else {
			toDelete.push(id);
			delete cache[id];
		}
	}

	console.log(`\nFile change: ${toUpdate.length} updated, ${toDelete.length} removed`);
	(async () => {
		for (const id of toDelete) {
			try { await unlink(`${OUT_DIR}/${id}.webp`); } catch {}
			console.log(`  rm ${id}.webp`);
		}
		await screenshotCases(page, toUpdate);
		await saveCache();
		console.log('Done.\n');
	})().catch(console.error);
}

watch(DATA_DIR, (event, filename) => {
	if (!filename || !filename.endsWith('.yaml')) return;
	pendingFiles.add(filename);
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(handleChanges, 800);
});

console.log(`Watching ${DATA_DIR} for YAML changes…`);
console.log('Press Ctrl+C to stop.\n');

process.on('SIGINT', async () => {
	console.log('\nShutting down…');
	clearTimeout(debounceTimer);
	await browser.close();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	clearTimeout(debounceTimer);
	await browser.close();
	process.exit(0);
});
