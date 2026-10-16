import { describe, expect, it } from "vitest";
import zipCentroids from "@/lib/data/zip-centroids.json";
import {
	getCoordinatesForZip,
	hasCountyZipPrefix,
	isValidZipFormat,
} from "./zip-lookup";

interface Coordinates {
	lat: number;
	lng: number;
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

/** Coordinates for a ZIP that must exist in the table */
function lookup(zip: string): Coordinates {
	const coords = getCoordinatesForZip(zip);
	if (!coords) throw new Error(`${zip} missing from ZIP table`);
	return coords;
}

describe("isValidZipFormat", () => {
	it("accepts valid 5-digit ZIP codes", () => {
		expect(isValidZipFormat("92101")).toBe(true);
		expect(isValidZipFormat("00000")).toBe(true);
		expect(isValidZipFormat("99999")).toBe(true);
	});

	it("rejects too-short strings", () => {
		expect(isValidZipFormat("9210")).toBe(false);
		expect(isValidZipFormat("")).toBe(false);
	});

	it("rejects too-long strings", () => {
		expect(isValidZipFormat("921012")).toBe(false);
	});

	it("rejects non-numeric strings", () => {
		expect(isValidZipFormat("abcde")).toBe(false);
		expect(isValidZipFormat("9210a")).toBe(false);
	});

	it("trims whitespace before validating", () => {
		expect(isValidZipFormat(" 92101 ")).toBe(true);
	});
});

describe("hasCountyZipPrefix", () => {
	it("accepts San Diego County prefixes", () => {
		expect(hasCountyZipPrefix("91901")).toBe(true);
		expect(hasCountyZipPrefix("92003")).toBe(true);
		expect(hasCountyZipPrefix("92199")).toBe(true);
	});

	it("rejects other prefixes", () => {
		expect(hasCountyZipPrefix("90210")).toBe(false);
		expect(hasCountyZipPrefix("92672")).toBe(false);
		expect(hasCountyZipPrefix("00000")).toBe(false);
	});
});

describe("getCoordinatesForZip", () => {
	it("returns the table entry for a known ZIP", () => {
		expect(getCoordinatesForZip("92101")).toEqual(zipCentroids["92101"]);
	});

	it("puts Downtown SD ZIP downtown", () => {
		// Horton Plaza
		expect(
			distanceKm(lookup("92101"), { lat: 32.7144, lng: -117.1622 }),
		).toBeLessThan(2);
	});

	it("returns null for unknown ZIP", () => {
		expect(getCoordinatesForZip("00000")).toBeNull();
	});

	it("resolves residential ZIPs the old hand-typed table missed", () => {
		// San Ysidro, La Jolla, Camp Pendleton, Pauma Valley
		for (const zip of ["92173", "92037", "92055", "92061"]) {
			expect(getCoordinatesForZip(zip)).not.toBeNull();
		}
	});

	it("resolves PO-box-only ZIPs near the town they serve", () => {
		// Fallbrook PO boxes → Fallbrook; San Ysidro PO boxes → San Ysidro
		expect(distanceKm(lookup("92088"), lookup("92028"))).toBeLessThan(10);
		expect(distanceKm(lookup("92143"), lookup("92173"))).toBeLessThan(5);
	});

	it("keeps corrected ZIPs away from GeoNames' bad points", () => {
		// Rancho Santa Fe near Rancho Santa Fe, not Poway
		expect(distanceKm(lookup("92091"), lookup("92067"))).toBeLessThan(10);
		// Base and campus ZIPs off the generic downtown point
		for (const zip of ["92135", "92147", "92179"]) {
			expect(distanceKm(lookup(zip), lookup("92101"))).toBeGreaterThan(3);
		}
	});

	it("returns null for ZIPs outside San Diego County", () => {
		// San Clemente (Orange County), Beverly Hills
		expect(getCoordinatesForZip("92672")).toBeNull();
		expect(getCoordinatesForZip("90210")).toBeNull();
	});

	it("trims whitespace", () => {
		expect(getCoordinatesForZip(" 92101 ")).toEqual(zipCentroids["92101"]);
	});

	it("uses only first 5 characters of longer strings", () => {
		expect(getCoordinatesForZip("921012345")).toEqual(zipCentroids["92101"]);
	});
});

describe("zip-centroids.json", () => {
	it("covers the county's ZIPs", () => {
		expect(Object.keys(zipCentroids).length).toBeGreaterThanOrEqual(150);
	});

	it("has finite coordinates near San Diego for every ZIP", () => {
		// Coarse garbage check (e.g. 0,0); placement is validated by the generator
		for (const { lat, lng } of Object.values(zipCentroids)) {
			expect(distanceKm({ lat, lng }, lookup("92101"))).toBeLessThan(150);
		}
	});
});
