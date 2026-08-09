/**
 * Generates public/icons/<case-id>.webp for every 1LL3T case.
 *
 * Serves the production build (which contains the unlinked /icon-renderer/
 * page), screenshots each case's twisty-player at its unsolved case state
 * without hint facelets, and converts to WebP via sharp.
 *
 * Usage: npm run icons
 * Requires: Google Chrome/Chromium at /usr/bin/google-chrome (playwright-core).
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const PORT = 4499;
const BASE = `http://localhost:${PORT}/Bencisco`;
const OUT_DIR = new URL('../public/icons/', import.meta.url).pathname;

// 1. Build
console.log('building…');
await new Promise((resolve, reject) => {
	const build = spawn('npx', ['astro', 'build'], { stdio: 'inherit' });
	build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))));
});

// 2. Serve
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
try {
	for (;;) {
		try {
			const res = await fetch(`${BASE}/icon-renderer/`);
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
	await page.goto(`${BASE}/icon-renderer/`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(8000);

	await mkdir(OUT_DIR, { recursive: true });
	const handles = await page.locator('[data-icon-case]').all();
	console.log(`rendering ${handles.length} icons…`);
	const filenames = [];
	for (const el of handles) {
		const id = await el.getAttribute('data-icon-case');
		const png = await el.screenshot({ omitBackground: true });
		await sharp(png).resize(256, 256).webp({ quality: 85 }).toFile(`${OUT_DIR}${id}.webp`);
		filenames.push(`${id}.webp`);
		console.log(`  ${id}.webp`);
	}
	await browser.close();

	// 4. Write manifest
	await writeFile(`${OUT_DIR}manifest.json`, JSON.stringify(filenames));
	console.log(`wrote manifest.json (${filenames.length} icons)`);
	console.log('done.');
} finally {
	server.kill();
}
