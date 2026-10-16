import { afterEach, describe, expect, it, vi } from "vitest";
import { trackClarityEvent } from "./clarity";

type ClarityWindow = Window & { clarity?: (...args: string[]) => void };

describe("trackClarityEvent", () => {
	afterEach(() => {
		delete (window as ClarityWindow).clarity;
	});

	it("does nothing when Clarity isn't loaded", () => {
		expect(() => trackClarityEvent("zip_not_found")).not.toThrow();
	});

	it("sets tags before sending the event", () => {
		const clarity = vi.fn();
		(window as ClarityWindow).clarity = clarity;

		trackClarityEvent("zip_not_found", { zip_not_found: "90210" });

		expect(clarity.mock.calls).toEqual([
			["set", "zip_not_found", "90210"],
			["event", "zip_not_found"],
		]);
	});

	it("sends the event without tags", () => {
		const clarity = vi.fn();
		(window as ClarityWindow).clarity = clarity;

		trackClarityEvent("zip_not_found");

		expect(clarity.mock.calls).toEqual([["event", "zip_not_found"]]);
	});
});
