# Bencisco

Bencisco method documentation: alg database + step-by-step tutorial. Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Commands

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build static site to `./dist/` |
| `npm run preview` | Preview the production build locally |

## Structure

- `src/content/docs/` - tutorial/alg pages (MDX)
- `src/data/` - YAML alg databases (validated at build time)
- `src/components/` - Astro components (PuzzleViewer, AlgTable, ...)
- `public/thumbnails/` - static FTO state images
