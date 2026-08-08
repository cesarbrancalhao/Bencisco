/**
 * Data files store `alg` in CIF community notation (brackets/slices resolved).
 * cubing.js (`Alg`, `<twisty-player>`) names the FTO faces differently, so the
 * π face map is applied here, at the render boundary — never in the data.
 *
 * π (community → cubing): F→BL  B→R  L→B  R→L  BL→BR  BR→F  (U, D fixed)
 * Wide moves: community `Xw` → cubing lowercase (e.g. `BRw'` → `f'`).
 * Rotation tokens (T', Rv, ...) and unrecognized tokens pass through.
 */
const PI: Record<string, string> = {
	U: 'U', D: 'D', F: 'BL', B: 'R', L: 'B', R: 'L', BL: 'BR', BR: 'F',
};

export function cifToTwizzle(alg: string): string {
	return alg
		.split(/\s+/)
		.map((tok) => {
			const open = tok.match(/^\(*/)?.[0] ?? '';
			const close = tok.match(/\)*$/)?.[0] ?? '';
			const core = tok.slice(open.length, tok.length - close.length);
			const m = core.match(/^(2?)(BL|BR|U|D|F|B|L|R)(w?)(2?)('?)$/);
			if (!m) return tok;
			const [, pre2, face, w, post2, prime] = m;
			const mapped = PI[face];
			return `${open}${pre2}${w ? mapped.toLowerCase() : mapped}${post2}${prime}${close}`;
		})
		.join(' ');
}
