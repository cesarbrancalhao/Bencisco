// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	output: 'static',
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
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/cesarbrancalhao/Bencisco' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.com/invite/NK53NGmDB6' },
			],
			sidebar: [
				{ label: 'Introduction', items: [{ autogenerate: { directory: 'introduction' } }] },
				{ label: 'First Block', items: [{ autogenerate: { directory: 'first-block' } }] },
				{ label: 'Remaining 3 Centers', slug: 'remaining-3-centers' },
				{
					label: 'Last 3 Triples',
					items: [
						{ label: 'Overview', slug: 'last-3-triples' },
						{ label: 'Pair Formation', slug: 'last-3-triples/pair-formation' },
						{ label: '2LTCP', slug: 'last-3-triples/2ltcp' },
						{ label: 'TCP', slug: 'last-3-triples/tcp', badge: { text: 'Advanced', variant: 'caution' } },
						{ label: 'OLP', slug: 'last-3-triples/olp', badge: { text: 'Advanced', variant: 'caution' } },
						{ label: '1LL3T', slug: 'last-3-triples/1ll3t', badge: { text: 'Advanced', variant: 'caution' } },
					],
				},
				{ label: 'Example Solves', items: [{ autogenerate: { directory: 'example-solves' } }] },
				{ label: 'Training', slug: 'training' },
			],
		}),
	],
});
