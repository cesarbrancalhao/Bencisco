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
				{ label: 'Learning Roadmap', slug: 'roadmap' },
				{ label: 'First Block', items: [{ autogenerate: { directory: 'first-block' } }] },
				{ label: 'Remaining 3 Centers', slug: 'remaining-3-centers' },
				{ label: 'Pair Formation', slug: 'pair-formation' },
				{
					label: 'Last 3 Triples',
					items: [
						{ label: 'Overview', slug: 'last-3-triples' },
						{
							label: '2LTCP',
							collapsed: true,
							items: [{ autogenerate: { directory: 'last-3-triples/2ltcp' } }],
						},
						{
							label: 'TCP (Advanced)',
							collapsed: true,
							items: [{ autogenerate: { directory: 'last-3-triples/tcp' } }],
						},
					],
				},
				{ label: 'OLP (Advanced)', slug: 'olp' },
				{ label: '1LL3T (Advanced)', slug: '1ll3t' },
				{ label: 'Example Solves', items: [{ autogenerate: { directory: 'example-solves' } }] },
				{ label: 'Training Drills', slug: 'training' },
				{ label: 'Statistics', slug: 'statistics' },
			],
		}),
	],
});
