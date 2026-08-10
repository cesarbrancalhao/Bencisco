function getCollectionId(): string | null {
	const table = document.querySelector<HTMLElement>('[data-collection]');
	return table?.dataset.collection ?? null;
}

function getTotals(): Record<string, number> {
	return (window as any).__benciscoCaseTotals ?? {};
}

function getStorageKey(collectionId: string): string {
	return `bencisco-learned-${collectionId}`;
}

function getLearned(collectionId: string): Set<string> {
	try {
		const raw = localStorage.getItem(getStorageKey(collectionId));
		if (!raw) return new Set();
		const arr: unknown = JSON.parse(raw);
		if (!Array.isArray(arr)) return new Set();
		return new Set(arr.filter((x): x is string => typeof x === 'string'));
	} catch {
		return new Set();
	}
}

function setLearned(collectionId: string, learned: Set<string>): void {
	localStorage.setItem(getStorageKey(collectionId), JSON.stringify([...learned]));
}

function toggleLearned(collectionId: string, caseId: string): boolean {
	const learned = getLearned(collectionId);
	if (learned.has(caseId)) {
		learned.delete(caseId);
		setLearned(collectionId, learned);
		return false;
	} else {
		learned.add(caseId);
		setLearned(collectionId, learned);
		return true;
	}
}

function updateButtonIcon(btn: HTMLElement, learned: boolean): void {
	const outline = btn.querySelector<HTMLElement>('.icon-outline');
	const fill = btn.querySelector<HTMLElement>('.icon-fill');
	if (!outline || !fill) return;
	if (learned) {
		outline.classList.add('hidden');
		fill.classList.remove('hidden');
		btn.classList.remove('opacity-50', 'text-gray-500', 'dark:text-gray-300');
		btn.classList.add('text-black', 'dark:text-white');
	} else {
		fill.classList.add('hidden');
		outline.classList.remove('hidden');
		btn.classList.add('opacity-50', 'text-gray-500', 'dark:text-gray-300');
		btn.classList.remove('text-black', 'dark:text-white');
	}
}

function updateSidebarBadge(collectionId: string): void {
	const total = getTotals()[collectionId];
	if (!total) return;

	const count = getLearned(collectionId).size;

	const sidebarLink = document.querySelector<HTMLAnchorElement>(
		`nav a[href$="/last-3-triples/${collectionId}/"]`,
	);
	if (!sidebarLink) return;

	const originalBadge = sidebarLink.querySelector<HTMLElement>('.sl-badge');
	let learnedBadge = sidebarLink.querySelector<HTMLElement>('.case-learned-badge');

	if (count > 0) {
		if (originalBadge) originalBadge.style.display = 'none';
		if (!learnedBadge) {
			learnedBadge = document.createElement('span');
			learnedBadge.className = 'case-learned-badge';
			const textSpan = sidebarLink.querySelector('span');
			if (textSpan) {
				textSpan.after(learnedBadge);
			} else {
				sidebarLink.appendChild(learnedBadge);
			}
		}
		learnedBadge.textContent = `${count}/${total}`;
	} else {
		learnedBadge?.remove();
		if (originalBadge) originalBadge.style.display = '';
	}
}

function updateAllBadges(): void {
	for (const collectionId of Object.keys(getTotals())) {
		updateSidebarBadge(collectionId);
	}
}

function initButtonStates(collectionId: string): void {
	const learned = getLearned(collectionId);
	document.querySelectorAll<HTMLElement>('.case-learned-btn').forEach((btn) => {
		const caseId = btn.dataset.caseId;
		if (!caseId) return;
		updateButtonIcon(btn, learned.has(caseId));
	});
}

function initLearnedStore(): void {
	updateAllBadges();

	const collectionId = getCollectionId();
	if (collectionId) {
		initButtonStates(collectionId);

		document.addEventListener('click', (e) => {
			const btn = (e.target as Element).closest('.case-learned-btn') as HTMLElement | null;
			if (!btn) return;
			const caseId = btn.dataset.caseId;
			if (!caseId) return;

			const learned = toggleLearned(collectionId, caseId);
			updateButtonIcon(btn, learned);
			updateSidebarBadge(collectionId);
		});
	}
}

initLearnedStore();
