/**
 * Lazy loader for <twisty-player>.
 *
 * - Thumbnail mode: nothing heavy loads until the user clicks
 *   "View interactive". `cubing/twisty` is dynamically imported on demand.
 * - Direct mode (low-density pages): the player markup is rendered by the
 *   component; we just register the custom element after load.
 * - Singleton: only one interactive player is open at a time - opening a
 *   new one restores the previous one back to its thumbnail.
 * - Uses event delegation on document so cloned puzzle viewers work.
 */

let twistyReady: Promise<unknown> | null = null;

function loadTwisty(): Promise<unknown> {
	twistyReady ??= import('cubing/twisty').catch((err: unknown) => {
		twistyReady = null; // allow retry on next click
		throw err;
	});
	return twistyReady;
}

let activeHost: HTMLElement | null = null;
let activeOriginalHTML = '';

function restoreActive(): void {
	if (!activeHost) return;
	activeHost.innerHTML = activeOriginalHTML;
	activeHost = null;
	activeOriginalHTML = '';
}

export function activate(host: HTMLElement): void {
	if (activeHost === host) return;
	restoreActive();

	const puzzle = host.dataset.puzzle ?? 'fto';
	const alg = host.dataset.alg ?? '';
	const setupAlg = host.dataset.setupAlg;
	const cameraLongitude = host.dataset.cameraLongitude;
	const stickeringMask = host.dataset.stickeringMask;
	const hintFacelets = host.dataset.hintFacelets;

	void loadTwisty()
		.then(() => {
			activeHost = host;
			activeOriginalHTML = host.innerHTML;

			const player = document.createElement('twisty-player');
			player.setAttribute('puzzle', puzzle);
			player.setAttribute('alg', alg);
		if (setupAlg) player.setAttribute('experimental-setup-alg', setupAlg);
		if (cameraLongitude) player.setAttribute('camera-longitude', cameraLongitude);
		if (stickeringMask) player.setAttribute('experimental-stickering-mask-orbits', stickeringMask);
			player.setAttribute('hint-facelets', hintFacelets ?? 'none');
			player.setAttribute('background', 'none');
			player.style.width = '256px';
			player.style.height = '192px';

			host.replaceChildren(player);
		})
		.catch((err: unknown) => {
			console.error('[PuzzleViewer] failed to load cubing/twisty:', err);
			const btn = host.querySelector<HTMLButtonElement>('button[data-puzzle-activate]');
			if (btn) btn.textContent = 'Load failed — click to retry';
		});
}

function initPuzzleViewers(): void {
	document.querySelectorAll<HTMLElement>('[data-puzzle-viewer]').forEach((host) => {
		if (host.dataset.mode === 'direct') {
			void loadTwisty().catch((err: unknown) => {
				console.error('[PuzzleViewer] failed to load cubing/twisty:', err);
			});
		}
	});

	document.addEventListener('click', (e) => {
		const btn = (e.target as Element).closest('button[data-puzzle-activate]');
		if (!btn) return;
		const host = btn.closest<HTMLElement>('[data-puzzle-viewer]');
		if (!host || host.dataset.mode === 'direct') return;
		activate(host);
	});

	document.addEventListener('puzzle-viewer:restore', () => {
		if (activeHost) restoreActive();
	});
}

initPuzzleViewers();

(window as any).__puzzleViewerActivate = activate;
(window as any).__puzzleViewerRestore = restoreActive;
