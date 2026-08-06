/**
 * Generates public/thumbnails/<case-id>.webp for every case in src/data/*.yaml.
 *
 * Serves the production build (which contains the unlinked /thumbnail-renderer/
 * page), screenshots each case's twisty-player at its unsolved case state, and
 * converts to WebP via sharp.
 *
 * Usage: npm run thumbnails
 * Requires: Google Chrome/Chromium at /usr/bin/google-chrome (playwright-core).
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const PORT = 4499;
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = new URL('../public/thumbnails/', import.meta.url).pathname;

// 1. Build
console.log('building…');
await new Promise((resolve, reject) => {
	const build = spawn('npx', ['astro', 'build'], { stdio: 'inherit' });
	build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))));
});

// 2. Serve
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
try {
	// wait for server
	for (;;) {
		try {
			const res = await fetch(`${BASE}/thumbnail-renderer/`);
			if (res.ok) break;
		} catch {}
		await new Promise((r) => setTimeout(r, 500));
	}

	// 3. Screenshot each case
	const browser = await chromium.launch({
		executablePath: '/usr/bin/google-chrome',
		args: ['--no-sandbox', '--use-gl=swiftshader'],
	});
	const page = await browser.newPage({ viewport: { width: 1400, height: 25000 } });
	await page.goto(`${BASE}/thumbnail-renderer/`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(8000); // let all players render (tall viewport: lazy init needs them visible)

	await mkdir(OUT_DIR, { recursive: true });
	const handles = await page.locator('[data-thumb-case]').all();
	console.log(`rendering ${handles.length} thumbnails…`);
	for (const el of handles) {
		const id = await el.getAttribute('data-thumb-case');
		const png = await el.screenshot({ omitBackground: true });
		await sharp(png).webp({ quality: 85 }).toFile(`${OUT_DIR}${id}.webp`);
		console.log(`  ${id}.webp`);
	}
	await browser.close();
	console.log('done.');
} finally {
	server.kill();
}
