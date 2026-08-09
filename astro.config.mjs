// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

function read1LL3TCaseIds() {
	const yamlPath = fileURLToPath(new URL('./src/data/1ll3t.yaml', import.meta.url));
	if (!existsSync(yamlPath)) return [];
	const doc = parseYaml(readFileSync(yamlPath, 'utf-8'));
	return (/** @type {Array<{id: string}>} */ (doc.cases || [])).map((c) => c.id).filter(Boolean);
}

function randomIconScript() {
	const ids = read1LL3TCaseIds();
	if (ids.length === 0) return '';
	const json = JSON.stringify(ids.map(/** @type {(id: string) => string} */ (id) => `${id}.webp`));
	return `(function(){var i=${json};var p=i[Math.floor(Math.random()*i.length)];var h='/Bencisco/icons/'+p;(new MutationObserver(function(m,o){var e=document.querySelector('.site-icon');if(e){e.src=h;o.disconnect()}})).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]').forEach(function(e){e.remove()});var l=document.createElement('link');l.rel='icon';l.href=h;document.head.appendChild(l)})})()`;
}

// https://astro.build/config
export default defineConfig({
	site: 'https://cesarbrancalhao.github.io',
	base: '/Bencisco',
	vite: {
		plugins: [tailwindcss()],
		// Pre-bundle cubing/twisty in dev so the on-click dynamic import never
		// hits a stale optimize-deps cache (504 Outdated Optimize Dep).
		// Dev-only; production still code-splits it out of the initial bundle.
		optimizeDeps: { include: ['cubing/twisty'] },
	},
	integrations: [
		starlight({
			title: 'Bencisco FTO',
			customCss: ['./src/styles/global.css'],
			// No search initially (see tx/proposed_structure.md → Navigation & UX).
			// Set to true to re-enable Starlight's built-in Pagefind search.
			tableOfContents: false,
			pagefind: false,
			head: [
				{
					tag: 'script',
					content: randomIconScript(),
				},
			],
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
				Footer: './src/components/Footer.astro',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/cesarbrancalhao/Bencisco' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.com/invite/NK53NGmDB6' },
			],
			sidebar: [
				{ label: 'Introduction', items: [{ autogenerate: { directory: 'introduction' } }] },
				{ label: 'First Block', collapsed: true, items: [{ autogenerate: { directory: 'first-block' } }] },
				{ label: 'Remaining 3 Centers', slug: 'remaining-3-centers', badge: { text: 'In Progress', variant: 'default' } },
				{
					label: 'Last 3 Triples',
					items: [
						{ label: 'Overview', slug: 'last-3-triples' },
						{ label: 'Pair Formation', slug: 'last-3-triples/pair-formation', badge: { text: 'In Progress', variant: 'default' } },
						{ label: '2LTCP', slug: 'last-3-triples/2ltcp' },
						{ label: 'TCP', slug: 'last-3-triples/tcp', badge: { text: 'Medium', variant: 'caution' } },
						{ label: 'OLP', slug: 'last-3-triples/olp', badge: { text: 'Advanced', variant: 'tip' } },
						{ label: '1LL3T', slug: 'last-3-triples/1ll3t', badge: { text: 'Advanced', variant: 'tip' } },
					],
				},
				{ label: 'Example Solves', items: [{ autogenerate: { directory: 'example-solves' } }] },
				{ label: 'Training', slug: 'training' },
				{ label: 'Credits', slug: 'credits' },
			],
		}),
	],
});
