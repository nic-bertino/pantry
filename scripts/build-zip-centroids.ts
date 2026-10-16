/**
 * Build lib/data/zip-centroids.json from the GeoNames US postal code dump.
 *
 * Covers every San Diego County ZIP, including PO-box-only ZIPs, with
 * coordinates at the town or neighborhood center. GeoNames data is
 * CC BY 4.0 (https://www.geonames.org/).
 *
 * GeoNames misplaces a few ZIPs, so OVERRIDES corrects them and validate()
 * fails the build when the data looks wrong in a way we've seen before. The
 * Census ZCTA list (public domain) tells residential ZIPs from PO-box ZIPs.
 *
 * Run with: bun run scripts/build-zip-centroids.ts
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GEONAMES_URL = "https://download.geonames.org/export/zip/US.zip";
const CENSUS_ZCTA_URL =
	"https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip";
const STATE_CODE = "CA";
const COUNTY_NAME = "San Diego";
// Sanity floor: the county has ~180 ZIPs; far fewer means the format changed
const MIN_EXPECTED = 150;
// Generous box around the county; anything outside it is bad data
const COUNTY_BOUNDS = {
	minLat: 32.5,
	maxLat: 33.55,
	minLng: -117.65,
	maxLng: -116.05,
};
// ZIPs that share a town name should be this close together. "San Diego"
// is exempt because the city spans ~60 km.
const MAX_SAME_PLACE_KM = 15;

/**
 * Corrections for ZIPs GeoNames gets wrong. Residential ZIPs use the Census
 * ZCTA interior point; PO-box ZIPs use the delivery ZIP they serve.
 */
const OVERRIDES: Record<string, Coordinates> = {
	"92058": { lat: 33.264, lng: -117.3448 }, // Oceanside; GeoNames uses the city PO-box point
	"92091": { lat: 33.0524, lng: -117.1828 }, // Rancho Santa Fe; GeoNames puts it in Poway
	"92092": { lat: 32.8755, lng: -117.2361 }, // UCSD; GeoNames uses the La Jolla PO-box point
	"92093": { lat: 32.8821, lng: -117.2371 }, // UCSD; GeoNames uses the La Jolla PO-box point
	"92096": { lat: 33.1282, lng: -117.1562 }, // CSUSM; GeoNames uses the San Marcos PO-box point
	"92135": { lat: 32.695, lng: -117.1944 }, // NAS North Island; GeoNames uses downtown
	"92143": { lat: 32.5626, lng: -117.043 }, // San Ysidro PO boxes, at 92173; GeoNames puts it near Ranchita
	"92147": { lat: 32.7247, lng: -117.2188 }, // Naval Base Point Loma; GeoNames uses downtown
	"92179": { lat: 32.5839, lng: -116.9335 }, // Otay Mesa East; GeoNames uses downtown
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, "../lib/data/zip-centroids.json");

interface Coordinates {
	lat: number;
	lng: number;
}

interface ZipRow extends Coordinates {
	place: string;
}

async function downloadAndExtract(
	url: string,
	member: string,
): Promise<string> {
	console.log(`Fetching ${url}`);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch ${url}: ${response.status} ${response.statusText}`,
		);
	}

	const workDir = mkdtempSync(join(tmpdir(), "zip-centroids-"));
	try {
		const zipPath = join(workDir, "download.zip");
		writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));
		return execFileSync("unzip", ["-p", zipPath, member], {
			encoding: "utf-8",
			maxBuffer: 64 * 1024 * 1024,
		});
	} finally {
		rmSync(workDir, { recursive: true, force: true });
	}
}

/**
 * GeoNames columns: country, postal code, place, admin1 name, admin1 code,
 * admin2 name, admin2 code, admin3 name, admin3 code, lat, lng, accuracy
 */
export function parseCountyZips(tsv: string): Record<string, ZipRow> {
	const rows: Record<string, ZipRow> = {};
	for (const line of tsv.split("\n")) {
		const f = line.split("\t");
		if (f[4] !== STATE_CODE || f[5] !== COUNTY_NAME) continue;

		// Number("") is 0, so blank coordinates must be rejected explicitly
		const [lat, lng] = [f[9], f[10]].map((v) =>
			v?.trim() ? Number(v) : Number.NaN,
		);
		if (
			!/^\d{5}$/.test(f[1]) ||
			!Number.isFinite(lat) ||
			!Number.isFinite(lng)
		) {
			throw new Error(`Unexpected row: ${line}`);
		}
		if (rows[f[1]]) throw new Error(`Duplicate ZIP ${f[1]}`);
		rows[f[1]] = { lat, lng, place: f[2] };
	}
	return rows;
}

/** Census gazetteer: one ZCTA per line, GEOID first */
export function parseZctas(tsv: string): Set<string> {
	return new Set(
		tsv
			.split("\n")
			.slice(1)
			.map((line) => line.split("\t")[0].trim())
			.filter(Boolean),
	);
}

function distanceKm(a: Coordinates, b: Coordinates): number {
	const rad = (d: number) => (d * Math.PI) / 180;
	const h =
		Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
		Math.cos(rad(a.lat)) *
			Math.cos(rad(b.lat)) *
			Math.sin(rad(b.lng - a.lng) / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Returns one message per problem; empty when the data looks right */
export function validate(
	rows: Record<string, ZipRow>,
	zctas: Set<string>,
): string[] {
	const problems: string[] = [];
	const entries = Object.entries(rows);

	if (entries.length < MIN_EXPECTED) {
		problems.push(
			`Only ${entries.length} ${COUNTY_NAME} County ZIPs; expected at least ${MIN_EXPECTED}`,
		);
	}

	for (const [zip, { lat, lng }] of entries) {
		const b = COUNTY_BOUNDS;
		if (lat < b.minLat || lat > b.maxLat || lng < b.minLng || lng > b.maxLng) {
			problems.push(`${zip} at ${lat},${lng} is outside the county`);
		}
	}

	const byPlace = new Map<string, [string, ZipRow][]>();
	for (const entry of entries) {
		if (entry[1].place === COUNTY_NAME) continue;
		byPlace.set(entry[1].place, [
			...(byPlace.get(entry[1].place) ?? []),
			entry,
		]);
	}
	for (const [place, group] of byPlace) {
		for (const [i, [zipA, a]] of group.entries()) {
			for (const [zipB, b] of group.slice(i + 1)) {
				const km = distanceKm(a, b);
				if (km > MAX_SAME_PLACE_KM) {
					problems.push(
						`${place}: ${zipA} and ${zipB} are ${km.toFixed(1)} km apart`,
					);
				}
			}
		}
	}

	// Residential ZIPs need their own point; sharing one means GeoNames fell
	// back to a city default. Overrides may deliberately reuse a delivery
	// ZIP's point, so they don't count.
	const zipsByPoint = new Map<string, string[]>();
	for (const [zip, { lat, lng }] of entries) {
		const key = `${lat},${lng}`;
		zipsByPoint.set(key, [...(zipsByPoint.get(key) ?? []), zip]);
	}
	for (const [zip, { lat, lng }] of entries) {
		const others = (zipsByPoint.get(`${lat},${lng}`) ?? []).filter(
			(z) => z !== zip && !(z in OVERRIDES),
		);
		if (zctas.has(zip) && others.length > 0) {
			const sample = others.slice(0, 3).join(", ");
			problems.push(
				`Residential ${zip} shares ${lat},${lng} with ${others.length} other ZIP(s) (${sample}${others.length > 3 ? ", …" : ""})`,
			);
		}
	}

	return problems;
}

async function main() {
	const rows = parseCountyZips(
		await downloadAndExtract(GEONAMES_URL, "US.txt"),
	);
	const zctas = parseZctas(
		await downloadAndExtract(CENSUS_ZCTA_URL, "2024_Gaz_zcta_national.txt"),
	);

	for (const [zip, coordinates] of Object.entries(OVERRIDES)) {
		if (!rows[zip]) throw new Error(`Override for unknown ZIP ${zip}`);
		rows[zip] = { ...rows[zip], ...coordinates };
	}

	const problems = validate(rows, zctas);
	if (problems.length > 0) {
		throw new Error(
			`ZIP data failed validation; fix the source or add an override:\n  ${problems.join("\n  ")}`,
		);
	}

	// Ship only coordinates; place names are just for validation
	const centroids: Record<string, Coordinates> = {};
	for (const zip of Object.keys(rows).sort()) {
		centroids[zip] = { lat: rows[zip].lat, lng: rows[zip].lng };
	}

	writeFileSync(outputPath, `${JSON.stringify(centroids, null, "\t")}\n`);
	console.log(`Wrote ${Object.keys(centroids).length} ZIPs to ${outputPath}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
