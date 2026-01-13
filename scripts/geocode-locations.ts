/**
 * Geocode script - adds lat/lng coordinates to locations.json
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Run with: bun run scripts/geocode-locations.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface Location {
	id: string;
	address: string;
	city: string;
	state: string;
	postcode: string;
	coordinates?: { lat: number; lng: number };
	[key: string]: unknown;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100; // Nominatim requires 1 request/second max

async function geocodeAddress(
	address: string,
	city: string,
	state: string,
	postcode: string,
): Promise<{ lat: number; lng: number } | null> {
	const query = `${address}, ${city}, ${state} ${postcode}`;
	const url = new URL(NOMINATIM_URL);
	url.searchParams.set("q", query);
	url.searchParams.set("format", "json");
	url.searchParams.set("limit", "1");
	url.searchParams.set("countrycodes", "us");

	try {
		const response = await fetch(url.toString(), {
			headers: {
				"User-Agent": "FindFoodNow/1.0 (food distribution finder prototype)",
			},
		});

		if (!response.ok) {
			console.error(`  HTTP ${response.status} for: ${query}`);
			return null;
		}

		const data = (await response.json()) as Array<{ lat: string; lon: string }>;

		if (data.length > 0) {
			return {
				lat: Number.parseFloat(data[0].lat),
				lng: Number.parseFloat(data[0].lon),
			};
		}

		console.error(`  No results for: ${query}`);
		return null;
	} catch (error) {
		console.error(`  Error geocoding: ${query}`, error);
		return null;
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
	const locationsPath = join(
		import.meta.dir,
		"../lib/data/locations.json",
	);
	const locations: Location[] = JSON.parse(readFileSync(locationsPath, "utf-8"));

	console.log(`Geocoding ${locations.length} locations...\n`);

	let geocoded = 0;
	let skipped = 0;
	let failed = 0;

	for (const location of locations) {
		// Skip if already has coordinates
		if (location.coordinates) {
			console.log(`✓ ${location.id} (already geocoded)`);
			skipped++;
			continue;
		}

		console.log(`→ ${location.id}`);
		const coords = await geocodeAddress(
			location.address,
			location.city,
			location.state,
			location.postcode,
		);

		if (coords) {
			location.coordinates = coords;
			console.log(`  ✓ ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
			geocoded++;
		} else {
			failed++;
		}

		// Rate limit
		await sleep(DELAY_MS);
	}

	// Write updated locations back
	writeFileSync(locationsPath, JSON.stringify(locations, null, "\t"));

	console.log(`\nDone!`);
	console.log(`  Geocoded: ${geocoded}`);
	console.log(`  Skipped: ${skipped}`);
	console.log(`  Failed: ${failed}`);
}

main().catch(console.error);
