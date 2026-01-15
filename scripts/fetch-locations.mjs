#!/usr/bin/env node
/**
 * Fetch locations data for build
 *
 * This script runs before the build to populate locations.json:
 * - If LOCATIONS_URL is set, fetches data from that URL
 * - Otherwise, copies locations.example.json as fallback
 *
 * Usage:
 *   LOCATIONS_URL=https://example.com/data.json node scripts/fetch-locations.mjs
 */

import { readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../lib/data");
const outputPath = join(dataDir, "locations.json");
const examplePath = join(dataDir, "locations.example.json");

async function fetchFromUrl(url) {
	console.log(`Fetching locations from: ${url}`);

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();

	// Validate it's an array
	if (!Array.isArray(data)) {
		throw new Error("Invalid data format: expected an array of locations");
	}

	console.log(`Fetched ${data.length} locations`);
	return data;
}

async function useExample() {
	console.log("No LOCATIONS_URL set, using example data");

	if (!existsSync(examplePath)) {
		throw new Error(`Example file not found: ${examplePath}`);
	}

	await copyFile(examplePath, outputPath);
	const data = JSON.parse(await readFile(outputPath, "utf-8"));
	console.log(`Copied ${data.length} example locations`);
	return data;
}

async function main() {
	const locationsUrl = process.env.LOCATIONS_URL;

	try {
		let data;

		if (locationsUrl) {
			data = await fetchFromUrl(locationsUrl);
			await writeFile(outputPath, JSON.stringify(data, null, "\t"), "utf-8");
		} else {
			data = await useExample();
		}

		console.log(`✓ locations.json ready with ${data.length} locations`);
	} catch (error) {
		console.error("✗ Failed to prepare locations data:", error.message);
		process.exit(1);
	}
}

main();
