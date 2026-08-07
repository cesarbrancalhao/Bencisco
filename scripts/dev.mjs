/**
 * Starts astro dev + the thumbnail watcher together.
 * Both processes are killed when this script receives SIGINT/SIGTERM.
 *
 * Usage: node scripts/dev.mjs
 */
import { spawn } from 'node:child_process';

const astro = spawn('npx', ['astro', 'dev'], { stdio: 'inherit', shell: true });
const watcher = spawn('node', ['scripts/thumbnails-watch.mjs'], { stdio: 'inherit', shell: true });

function cleanup() {
	astro.kill('SIGTERM');
	watcher.kill('SIGTERM');
}

process.on('SIGINT', () => {
	cleanup();
	process.exit(0);
});

process.on('SIGTERM', () => {
	cleanup();
	process.exit(0);
});

// Propagate child exits
astro.on('exit', (code) => {
	watcher.kill('SIGTERM');
	process.exit(code ?? 0);
});

watcher.on('exit', (code) => {
	astro.kill('SIGTERM');
	process.exit(code ?? 0);
});
