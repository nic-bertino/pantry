import { describe, expect, it } from "vitest";
import { approximateCount } from "./count";

describe("approximateCount", () => {
	it("returns exact string for values below 10", () => {
		expect(approximateCount(0)).toBe("0");
		expect(approximateCount(1)).toBe("1");
		expect(approximateCount(5)).toBe("5");
		expect(approximateCount(9)).toBe("9");
	});

	it("rounds down to nearest 10 with + for values 10-99", () => {
		expect(approximateCount(10)).toBe("10+");
		expect(approximateCount(11)).toBe("10+");
		expect(approximateCount(42)).toBe("40+");
		expect(approximateCount(99)).toBe("90+");
	});

	it("rounds down to nearest 50 with + for values 100+", () => {
		expect(approximateCount(100)).toBe("100+");
		expect(approximateCount(149)).toBe("100+");
		expect(approximateCount(150)).toBe("150+");
		expect(approximateCount(359)).toBe("350+");
		expect(approximateCount(383)).toBe("350+");
		expect(approximateCount(999)).toBe("950+");
	});

	it("handles boundary at 10", () => {
		expect(approximateCount(9)).toBe("9");
		expect(approximateCount(10)).toBe("10+");
	});

	it("handles boundary at 100", () => {
		expect(approximateCount(99)).toBe("90+");
		expect(approximateCount(100)).toBe("100+");
	});
});
