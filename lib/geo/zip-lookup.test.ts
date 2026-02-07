import { describe, expect, it } from "vitest";
import { getCoordinatesForZip, isValidZipFormat } from "./zip-lookup";

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

describe("getCoordinatesForZip", () => {
	it("returns coordinates for known Downtown SD ZIP", () => {
		const coords = getCoordinatesForZip("92101");
		expect(coords).toEqual({ lat: 32.7195, lng: -117.1628 });
	});

	it("returns coordinates for known Encinitas ZIP", () => {
		const coords = getCoordinatesForZip("92024");
		expect(coords).toEqual({ lat: 33.0372, lng: -117.2789 });
	});

	it("returns null for unknown ZIP", () => {
		expect(getCoordinatesForZip("00000")).toBeNull();
	});

	it("trims whitespace", () => {
		expect(getCoordinatesForZip(" 92101 ")).toEqual({
			lat: 32.7195,
			lng: -117.1628,
		});
	});

	it("uses only first 5 characters of longer strings", () => {
		expect(getCoordinatesForZip("921012345")).toEqual({
			lat: 32.7195,
			lng: -117.1628,
		});
	});
});
