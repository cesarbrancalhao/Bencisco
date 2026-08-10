function getActivate(): ((host: HTMLElement) => void) | undefined {
	return (window as any).__puzzleViewerActivate;
}

interface CaseData {
	id: string;
	name?: string;
	family?: string;
	pairs?: string;
	scramble?: string;
	evenScramble?: string;
	oddScramble?: string;
	effectiveAlg: string;
	setupAlg?: string;
	showcaseAlgs: { alg: string; label: string | null }[];
	eifAlg?: string;
	eifLabel?: string;
	hasOlpParity: boolean;
	evenAlg?: string;
	evenEffectiveAlg?: string;
	evenSetupAlg?: string;
	evenThumbnail?: string;
	oddAlg?: string;
	oddEffectiveAlg?: string;
	oddSetupAlg?: string;
	oddThumbnail?: string;
	cameraLongitude?: number;
	stickeringMask?: string;
	hintFacelets: boolean;
	thumbnail: string;
	shorterIsOdd: boolean;
}

let currentCaseData: CaseData | null = null;
let currentParity: 'even' | 'odd' = 'even';

function buildPuzzleViewer(data: CaseData, parity: 'even' | 'odd'): HTMLElement {
	const isOlp = data.hasOlpParity;
	let effectiveAlg = data.effectiveAlg;
	let setupAlg = data.setupAlg;
	let thumb = data.thumbnail;

	if (isOlp && parity === 'even') {
		effectiveAlg = data.evenEffectiveAlg ?? data.effectiveAlg;
		setupAlg = data.evenSetupAlg;
		thumb = data.evenThumbnail ?? data.thumbnail;
	} else if (isOlp && parity === 'odd') {
		effectiveAlg = data.oddEffectiveAlg ?? data.effectiveAlg;
		setupAlg = data.oddSetupAlg;
		thumb = data.oddThumbnail ?? data.thumbnail;
	}

	const host = document.createElement('div');
	host.className = 'puzzle-viewer not-content flex flex-col items-center gap-2';
	host.setAttribute('data-puzzle-viewer', '');
	host.setAttribute('data-mode', 'thumbnail');
	host.setAttribute('data-puzzle', 'fto');
	host.setAttribute('data-alg', effectiveAlg);
	if (setupAlg) host.setAttribute('data-setup-alg', setupAlg);
	if (data.cameraLongitude) host.setAttribute('data-camera-longitude', String(data.cameraLongitude));
	if (data.stickeringMask) host.setAttribute('data-stickering-mask', data.stickeringMask);
	if (!data.hintFacelets) host.setAttribute('data-hint-facelets', 'none');

	const img = document.createElement('img');
	img.src = thumb;
	img.alt = data.name ?? data.id;
	img.width = 256;
	img.height = 192;
	img.loading = 'lazy';
	img.className = 'rounded-lg border border-gray-200 dark:border-gray-700';
	host.appendChild(img);

	const btn = document.createElement('button');
	btn.type = 'button';
	btn.setAttribute('data-puzzle-activate', '');
	btn.className = 'cursor-pointer rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700';
	btn.textContent = 'View interactive';
	host.appendChild(btn);

	return host;
}

function renderAlg(alg: string): string {
	return alg.replace(
		/\(([^)]+)\)/g,
		'<span class="text-red-500 dark:text-red-400">$1</span>',
	);
}

function updateScrambleDisplay(container: HTMLElement, scramble: string | null | undefined): void {
	if (scramble) {
		container.innerHTML = '';
		const label = document.createElement('span');
		label.className = 'text-xs text-gray-400 dark:text-gray-500';
		label.textContent = 'Scramble';
		container.appendChild(label);
		const code = document.createElement('code');
		code.className = 'text-xs';
		code.textContent = scramble;
		container.appendChild(code);
		container.classList.remove('hidden');
	} else {
		container.classList.add('hidden');
	}
}

function updateParityButtons(activeParity: 'even' | 'odd'): void {
	const container = document.getElementById('case-modal-parity-btns');
	if (!container) return;

	container.querySelectorAll('.modal-parity-btn').forEach((b) => {
		const el = b as HTMLElement;
		const isActive = el.dataset.parity === activeParity;
		if (isActive) {
			el.className =
				'modal-parity-btn cursor-pointer rounded-md border-2 border-indigo-500 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300';
		} else {
			el.className =
				'modal-parity-btn cursor-pointer rounded-md border border-gray-300 px-2.5 py-1 text-xs font-bold text-gray-500 hover:border-indigo-300 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500';
		}
	});
}

function switchParity(data: CaseData, parity: 'even' | 'odd'): void {
	if (!data.hasOlpParity) return;
	currentParity = parity;

	const puzzleContainer = document.getElementById('case-modal-puzzle');
	if (!puzzleContainer) return;

	const existing = puzzleContainer.querySelector<HTMLElement>('[data-puzzle-viewer]');

	let effectiveAlg = data.effectiveAlg;
	let setupAlg = data.setupAlg;
	let thumb = data.thumbnail;

	if (parity === 'even') {
		effectiveAlg = data.evenEffectiveAlg ?? data.effectiveAlg;
		setupAlg = data.evenSetupAlg;
		thumb = data.evenThumbnail ?? data.thumbnail;
	} else {
		effectiveAlg = data.oddEffectiveAlg ?? data.effectiveAlg;
		setupAlg = data.oddSetupAlg;
		thumb = data.oddThumbnail ?? data.thumbnail;
	}

	if (!existing) return;

	existing.setAttribute('data-alg', effectiveAlg);
	if (setupAlg) existing.setAttribute('data-setup-alg', setupAlg);
	else existing.removeAttribute('data-setup-alg');

	const img = existing.querySelector('img');
	if (img) img.src = thumb;

	existing.dispatchEvent(new CustomEvent('puzzle-viewer:restore', { bubbles: true }));

	updateParityButtons(parity);
	const scrambleEl = document.getElementById('case-modal-scramble');
	if (scrambleEl) {
		updateScrambleDisplay(scrambleEl, parity === 'even' ? data.evenScramble : data.oddScramble);
	}
}

function openModal(data: CaseData): void {
	const overlay = document.getElementById('case-modal-overlay');
	if (!overlay) return;

	const puzzleContainer = document.getElementById('case-modal-puzzle');
	const infoContainer = document.getElementById('case-modal-info');
	if (!puzzleContainer || !infoContainer) return;

	puzzleContainer.innerHTML = '';
	infoContainer.innerHTML = '';

	currentCaseData = data;
	currentParity = data.shorterIsOdd ? 'odd' : 'even';

	const initParity = data.hasOlpParity ? currentParity : 'even';

	// --- Puzzle viewer ---
	const viewer = buildPuzzleViewer(data, initParity);
	puzzleContainer.appendChild(viewer);

	// --- Name + family ---
	const header = document.createElement('div');
	header.className = 'flex flex-col items-center gap-0.5 text-center';
	if (data.name) {
		const nameEl = document.createElement('span');
		nameEl.className = 'text-lg font-semibold';
		nameEl.textContent = data.name;
		header.appendChild(nameEl);
	}
	const familyText = data.pairs ?? data.family;
	if (familyText) {
		const familyEl = document.createElement('span');
		familyEl.className = 'text-sm text-gray-500 dark:text-gray-400';
		familyEl.textContent = familyText;
		header.appendChild(familyEl);
	}
	infoContainer.appendChild(header);

	// --- Scramble ---
	const scrambleDiv = document.createElement('div');
	scrambleDiv.id = 'case-modal-scramble';
	scrambleDiv.className = 'flex flex-col items-center gap-1';
	infoContainer.appendChild(scrambleDiv);
	updateScrambleDisplay(
		scrambleDiv,
		data.hasOlpParity
			? initParity === 'even'
				? data.evenScramble
				: data.oddScramble
			: data.scramble,
	);

	// --- OLP parity buttons (below scramble) ---
	if (data.hasOlpParity) {
		const btnsDiv = document.createElement('div');
		btnsDiv.id = 'case-modal-parity-btns';
		btnsDiv.className = 'flex flex-col items-center gap-1.5';

		const ordered: ('even' | 'odd')[] = data.shorterIsOdd ? ['odd', 'even'] : ['even', 'odd'];
		for (const parity of ordered) {
			const sa = data.showcaseAlgs.find(
				(a) => a.label === (parity === 'even' ? 'Even' : 'Odd'),
			);
			if (!sa) continue;
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.dataset.parity = parity;
			btn.className = 'modal-parity-btn';
			const label = document.createElement('span');
			label.className = 'font-normal text-indigo-500 dark:text-indigo-400';
			label.textContent = `(${sa.label}) `;
			btn.appendChild(label);
			btn.insertAdjacentHTML('beforeend', renderAlg(sa.alg));
			btnsDiv.appendChild(btn);
		}

		infoContainer.appendChild(btnsDiv);
		updateParityButtons(initParity);
	}

	// --- Showcase algs (OLP Even/Odd algs are the parity buttons above) ---
	const algsDiv = document.createElement('div');
	algsDiv.className = 'flex flex-col items-center gap-1.5';

	for (const sa of data.showcaseAlgs) {
		if (data.hasOlpParity && (sa.label === 'Even' || sa.label === 'Odd')) continue;
		const code = document.createElement('code');
		code.className = 'text-sm font-bold';
		if (sa.label) {
			const label = document.createElement('span');
			label.className = 'font-normal text-indigo-500 dark:text-indigo-400';
			label.textContent = `(${sa.label}) `;
			code.appendChild(label);
		} else {
			const label = document.createElement('span');
			label.className = 'font-normal text-indigo-500 dark:text-indigo-400';
			label.textContent = '(CIF) ';
			code.appendChild(label);
		}
		code.insertAdjacentHTML('beforeend', renderAlg(sa.alg));
		algsDiv.appendChild(code);
	}

	// --- EIF alg ---
	if (data.eifAlg) {
		const eifCode = document.createElement('code');
		eifCode.className = 'text-sm text-gray-500 dark:text-gray-400';
		const eifLabel = document.createElement('span');
		eifLabel.className = 'text-indigo-500 dark:text-indigo-400';
		eifLabel.textContent = `(${data.eifLabel ?? 'EIF'}) `;
		eifCode.appendChild(eifLabel);
		eifCode.insertAdjacentHTML('beforeend', renderAlg(data.eifAlg));
		algsDiv.appendChild(eifCode);
	}

	infoContainer.appendChild(algsDiv);

	// --- Show ---
	overlay.classList.remove('hidden');
	document.body.style.overflow = 'hidden';
}

function closeModal(): void {
	const overlay = document.getElementById('case-modal-overlay');
	if (!overlay) return;

	overlay.dispatchEvent(new CustomEvent('puzzle-viewer:restore', { bubbles: true }));
	overlay.classList.add('hidden');
	document.body.style.overflow = '';

	currentCaseData = null;
}

function initCaseModal(): void {
	// Expand button clicks (event delegation)
	document.addEventListener('click', (e) => {
		const btn = (e.target as Element).closest('.case-expand-btn') as HTMLElement | null;
		if (!btn) return;

		const card = btn.closest('.case-card') as HTMLElement | null;
		if (!card) return;

		const dataEl = card.querySelector<HTMLElement>('.case-data');
		if (!dataEl?.textContent) return;

		try {
			const caseData: CaseData = JSON.parse(dataEl.textContent);
			openModal(caseData);
		} catch (err) {
			console.error('Failed to parse case data:', err);
		}
	});

	// Parity toggle in modal (event delegation)
	document.addEventListener('click', (e) => {
		const btn = (e.target as Element).closest('.modal-parity-btn') as HTMLElement | null;
		if (!btn) return;
		const parity = btn.dataset.parity as 'even' | 'odd' | undefined;
		if (!parity || !currentCaseData) return;
		switchParity(currentCaseData, parity);
	});

	// Close button
	document.getElementById('case-modal-close')?.addEventListener('click', closeModal);

	// Click backdrop
	document.getElementById('case-modal-overlay')?.addEventListener('click', (e) => {
		if (e.target === document.getElementById('case-modal-overlay')) {
			closeModal();
		}
	});

	// Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape') return;
		const overlay = document.getElementById('case-modal-overlay');
		if (overlay && !overlay.classList.contains('hidden')) {
			closeModal();
		}
	});
}

initCaseModal();
