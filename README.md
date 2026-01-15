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
- **Eligibility filtering** — Quickly find locations with no documentation
  requirements
- **Mobile-first** — Designed for the people who need it most, on the devices
  they use

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

## Data

Location data is fetched at build time. Each location includes:

- Name (bilingual)
- Address and coordinates
- Schedule (weekly hours or special patterns like "2nd and 4th Wednesday")
- Contact information
- Eligibility requirements (if any)
- Service type (walk-up, drive-through)

## License

MIT
