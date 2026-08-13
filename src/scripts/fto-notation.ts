/**
 * Data files store `alg`/`scramble` in CIF community notation. cubing.js FTO
 * uses the same face names, so tokens pass through unchanged — the ONLY things
 * resolved here are community-only notations cubing.js can't parse:
 *
 * - wide moves:  `Xw` -> lowercase (`Rw'` -> `r'`, `BRw` -> `br`)
 * - slice moves: `Xs` -> `x X'`  (`Rs` -> `r R'`, `Fs'` -> `f' F`, `Xs2` -> `x2 X2`)
 * - sledges/hedges: `S` -> `(R' L R L')`, `S'` -> `(L R' L' R)`,
 *   `H` -> `(R B' R' B)`, `H'` -> `(B' R B R')`
 *
 * Rotation tokens (Uv, Rv, T', ...) and unrecognized tokens pass through.
 *
 * Historical note: this used to apply a "π" face map (F→BL, B→R, L→B, R→L,
 * BL→BR, BR→F) under the assumption that cubing.js names FTO faces
 * differently. π was exactly conjugation by Uv (verified on the kpuzzle:
 * π(x) = Uv'·x·Uv for faces AND rotations), so the old pipeline only worked
 * because every π-mapped alg was paired with a `Uv` alg_prefix and a -120°
 * camera — and it silently broke any `Xv` rotation token, which passed
 * through unmapped and therefore rotated around the wrong axis. Removed in
 * favor of this 1:1 resolver plus dropping the Uv/-120° compensation from the
 * data files (pixel-identical rendering, verified by screenshot diff).
 */
const SH: Record<string, string> = {
	H: "(R B' R' B)",
	"H'": "(B' R B R')",
	S: "(R' L R L')",
	"S'": "(L R' L' R)",
};

export function resolveCif(alg: string): string {
	return alg
		.split(/\s+/)
		.filter(Boolean)
		.map((tok) => {
			const open = tok.match(/^\(*/)?.[0] ?? '';
			const close = tok.match(/\)*$/)?.[0] ?? '';
			const core = tok.slice(open.length, tok.length - close.length);
			if (SH[core]) return `${open}${SH[core]}${close}`;
			let m = core.match(/^(BL|BR|U|D|F|B|L|R)w(2?)('?)$/);
			if (m) return `${open}${m[1].toLowerCase()}${m[2]}${m[3]}${close}`;
			m = core.match(/^(BL|BR|U|D|F|B|L|R)s(2?)('?)$/);
			if (m) {
				const [, face, two, prime] = m;
				const wide = face.toLowerCase();
				// Xs = x X' ; Xs' = x' X ; Xs2 = x2 X2
				return prime
					? `${open}${wide}'${two} ${face}${two}${close}`
					: `${open}${wide}${two} ${face}'${two}${close}`;
			}
			return tok;
		})
		.join(' ');
}
