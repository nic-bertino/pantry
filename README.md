# Pantry

A mobile-first web app to help people find free food distribution locations.
Bilingual (English/Spanish) with real-time availability and distance-based
sorting.

## Features

- **Real-time availability** — See which locations are open now, today,
  tomorrow, or this week
- **Bilingual** — Full English and Spanish support, auto-detected from browser
- **Distance-aware** — Optional geolocation to sort by proximity and filter by
  distance
- **Mobile-first** — Designed to help find food in any context.

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
bun dev          # Start development server
bun run build    # Production build
bun run lint     # Run ESLint
```

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- TypeScript

## Deploying Pantry: Locations

Pantry uses a draft locations schema located at `lib/data/locations.schema.json`, with example locations built in `lib/data/locations.example.json`.

The default build process checks .env for `LOCATIONS_URL` and can rebuilds on deploy.

**Help needed**: If you have a schema format change request, please start a PR or discussion–the schema is expected to change and evolve. 

Each location includes:

- Name (bilingual)
- Address and coordinates
- Schedule (weekly hours or special patterns like "2nd and 4th Wednesday")
- Contact information
- Eligibility requirements (if any)
- Service type (walk-up, drive-through)

## Design principles

Two questions drive every feature and designed element of Pantry:

- Where am I?
- How quickly can I get help?

Pantry differs from maps or "store locator" displays: these can be overwhelming and can require many inputs to find useful information quickly. Within seconds of visiting Pantry, it should be immediately clear where food resources are available. 

## License

MIT
