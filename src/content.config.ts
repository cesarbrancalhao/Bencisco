import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * A single alg case.
 *
 * - `alg` - Twizzle notation; what <twisty-player> animates.
 * - `showcase_alg` - the written alg shown to the user (community notation;
 *   not always Twizzle-compatible, hence stored separately).
 * - `showcase_label` - optional styled prefix for the showcase alg, e.g.
 *   "EIF" or "CIF -> EIF" (rendered in parentheses, indigo).
 * - `eif_alg` - optional EIF variant, shown secondary; `eif_label` overrides
 *   its "(EIF)" prefix label.
 * - `name` - prominent label on the card; `family` - small secondary label.
 */
const algCase = z.object({
	id: z.string(),
	name: z.string().optional(),
	family: z.string().optional(),
	alg: z.string(),
	showcase_alg: z.string().optional(),
	showcase_label: z.string().optional(),
	eif_alg: z.string().optional(),
	eif_label: z.string().optional(),
	// Per-case setup-alg prefix; overrides the file-level `setup_prefix`.
	preset: z.string().optional(),
	thumbnail: z.string().optional(),
}).passthrough(); // allows showcase_alg1, showcase_alg2, ... for multi-alg cases

const algs = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/data' }),
	schema: z.object({
		// Prepended to every case's setup-alg, e.g. "Rv T" to put yellow on
		// top for last-layer cases. Drives both the applet and the thumbnails.
		setup_prefix: z.string().optional(),
		cases: z.array(algCase),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	algs,
};
