import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * A single alg case.
 *
 * - `alg` - CIF community notation (brackets/slices resolved); what <twisty-player> animates
 *   after resolveCif normalizes community-only tokens (Xw/Xs/H/S) at render time.
 *   cubing.js FTO uses the same face names, so moves play exactly as written.
 * - `scramble` - inverse of `alg` in CIF community notation; precomputed so the
 *   user can inspect/correct it. Used as the twisty-player's setup-alg.
 * - `showcase_alg` - the written alg shown to the user (community notation;
 *   not always Twizzle-compatible, hence stored separately).
 * - `showcase_label` - optional styled prefix for the showcase alg, e.g.
 *   "EIF" or "CIF -> EIF" (rendered in parentheses, indigo).
 * - `eif_alg` - optional EIF variant, shown secondary; `eif_label` overrides
 *   its "(EIF)" prefix label.
 * - `name` - prominent label on the card; `family` - small secondary label.
 * - `preset` - per-case setup-alg prefix; overrides file/family-level prefixes.
 * - `postset` - per-case move/rotation appended after the alg; overrides
 *   file/family-level suffixes.
 * - `alg_prefix` - per-case override for the file-level `alg_prefix` (use `""` to opt out).
 */
const algCase = z.object({
	id: z.string(),
	name: z.string().optional(),
	family: z.string().optional(),
	pairs: z.string().optional(),
	alg: z.string(),
	scramble: z.string().optional(),
	even_scramble: z.string().optional(),
	odd_scramble: z.string().optional(),
	odd_alg: z.string().optional(),
	even_alg: z.string().optional(),
	showcase_alg: z.string().optional(),
	showcase_label: z.string().optional(),
	eif_alg: z.string().optional(),
	eif_label: z.string().optional(),
	preset: z.string().optional(),
	postset: z.string().optional(),
	alg_prefix: z.string().optional(),
	thumbnail: z.string().optional(),
}).passthrough(); // allows showcase_alg1, showcase_alg2, ... for multi-alg cases

const algs = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/data' }),
	schema: z.object({
		// Prepended to every case's setup-alg, e.g. "Rv T" to put yellow on
		// top for last-layer cases. Drives both the applet and the thumbnails.
		setup_prefix: z.string().optional(),
		// Appended to every case's alg (post-solve rotation), e.g. "Rv" to
		// align or change the final view. Drives both the applet and thumbnails.
		setup_suffix: z.string().optional(),
		// Per-family setup-alg prefixes (family name -> prefix).
		// Overrides `setup_prefix` for cases in that family.
		// A case-level `preset` still takes precedence over both.
		family_prefixes: z.record(z.string(), z.string()).optional(),
		// Per-family post-alg suffixes (family name -> suffix).
		// Overrides `setup_suffix` for cases in that family.
		// A case-level `postset` still takes precedence over both.
		family_suffixes: z.record(z.string(), z.string()).optional(),
		// Appended to every case's setup-alg, after the scramble (legacy frame
		// compensation — the last-layer files used it together with a -120°
		// camera_longitude before the π face map was removed; currently unused).
		// NOT applied in the thumbnail renderer.
		alg_prefix: z.string().optional(),
		// Per-family alg_prefix overrides (family name -> prefix).
		family_alg_prefixes: z.record(z.string(), z.string()).optional(),
		// Camera longitude in degrees for the interactive twisty-player
		// (default 0). Legacy files paired -120 with a `Uv` alg_prefix to
		// compensate the removed π face map.
		camera_longitude: z.number().optional(),
		// Render thumbnails from a raised top-down camera angle (shows the top
		// face plus all sides) instead of the default flat face-on view.
		top_down: z.boolean().optional(),
		// Serialized cubing.js stickering mask (experimental-stickering-mask-orbits,
		// e.g. "C4RNER:-I-I-I,...") applied to every case of the file — interactive
		// player and thumbnails. Hides everything but the recognition stickers
		// ("-" = regular, "D" = dim, "I" = ignored). Used by olp.yaml.
		stickering_mask: z.string().optional(),
		cases: z.array(algCase),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	algs,
};
