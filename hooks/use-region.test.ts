import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REGIONS, useRegion } from "./use-region";

vi.mock("next/navigation", () => ({
	useSearchParams: vi.fn(),
}));

import { useSearchParams } from "next/navigation";

const mockUseSearchParams = vi.mocked(useSearchParams);

function mockSearchParam(value: string | null) {
	mockUseSearchParams.mockReturnValue({
		get: (key: string) => (key === "region" ? value : null),
	} as ReturnType<typeof useSearchParams>);
}

describe("useRegion", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns san-diego config when no region param", () => {
		mockSearchParam(null);
		const { result } = renderHook(() => useRegion());
		expect(result.current).toEqual(REGIONS["san-diego"]);
	});

	it("returns san-diego config for valid san-diego param", () => {
		mockSearchParam("san-diego");
		const { result } = renderHook(() => useRegion());
		expect(result.current.id).toBe("san-diego");
		expect(result.current.name).toBe("San Diego");
	});

	it("returns default for unknown region param", () => {
		mockSearchParam("unknown-region");
		const { result } = renderHook(() => useRegion());
		expect(result.current).toEqual(REGIONS["san-diego"]);
	});

	it("returns default for region type not in REGIONS map", () => {
		mockSearchParam("riverside");
		const { result } = renderHook(() => useRegion());
		expect(result.current).toEqual(REGIONS["san-diego"]);
	});
});
