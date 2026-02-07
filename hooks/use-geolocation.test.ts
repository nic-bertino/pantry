import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGeolocation } from "./use-geolocation";

describe("useGeolocation", () => {
	let mockGetCurrentPosition: ReturnType<typeof vi.fn>;
	let mockPermissionsQuery: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockGetCurrentPosition = vi.fn();
		mockPermissionsQuery = vi.fn().mockRejectedValue(new Error("not supported"));

		Object.defineProperty(globalThis, "navigator", {
			value: {
				geolocation: {
					getCurrentPosition: mockGetCurrentPosition,
				},
				permissions: {
					query: mockPermissionsQuery,
				},
			},
			writable: true,
			configurable: true,
		});
	});

	it("has correct initial state", () => {
		const { result } = renderHook(() => useGeolocation());
		expect(result.current.coordinates).toBeNull();
		expect(result.current.error).toBeNull();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.source).toBeNull();
		expect(result.current.zipCode).toBeNull();
	});

	it("sets coordinates on successful geolocation", async () => {
		mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
			success({
				coords: { latitude: 32.72, longitude: -117.16 },
			} as GeolocationPosition);
		});

		const { result } = renderHook(() => useGeolocation());

		await act(async () => {
			result.current.requestPermission();
		});

		expect(result.current.coordinates).toEqual({
			lat: 32.72,
			lng: -117.16,
		});
		expect(result.current.permissionState).toBe("granted");
		expect(result.current.source).toBe("browser");
		expect(result.current.isLoading).toBe(false);
	});

	it("handles permission denied error", async () => {
		mockGetCurrentPosition.mockImplementation(
			(_success: PositionCallback, error: PositionErrorCallback) => {
				error({
					code: 1,
					message: "User denied",
					PERMISSION_DENIED: 1,
					POSITION_UNAVAILABLE: 2,
					TIMEOUT: 3,
				} as GeolocationPositionError);
			},
		);

		const { result } = renderHook(() => useGeolocation());

		await act(async () => {
			result.current.requestPermission();
		});

		expect(result.current.error).toBe("Location permission denied");
		expect(result.current.permissionState).toBe("denied");
	});

	it("handles position unavailable error", async () => {
		mockGetCurrentPosition.mockImplementation(
			(_success: PositionCallback, error: PositionErrorCallback) => {
				error({
					code: 2,
					message: "Position unavailable",
					PERMISSION_DENIED: 1,
					POSITION_UNAVAILABLE: 2,
					TIMEOUT: 3,
				} as GeolocationPositionError);
			},
		);

		const { result } = renderHook(() => useGeolocation());

		await act(async () => {
			result.current.requestPermission();
		});

		expect(result.current.error).toBe("Location unavailable - try again");
		expect(result.current.permissionState).toBe("prompt");
	});

	it("handles timeout error", async () => {
		mockGetCurrentPosition.mockImplementation(
			(_success: PositionCallback, error: PositionErrorCallback) => {
				error({
					code: 3,
					message: "Timeout",
					PERMISSION_DENIED: 1,
					POSITION_UNAVAILABLE: 2,
					TIMEOUT: 3,
				} as GeolocationPositionError);
			},
		);

		const { result } = renderHook(() => useGeolocation());

		await act(async () => {
			result.current.requestPermission();
		});

		expect(result.current.error).toBe("Location request timed out");
		expect(result.current.permissionState).toBe("prompt");
	});

	it("handles missing geolocation API", () => {
		Object.defineProperty(globalThis, "navigator", {
			value: {},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useGeolocation());

		act(() => {
			result.current.requestPermission();
		});

		expect(result.current.error).toBe("Geolocation is not supported");
		expect(result.current.permissionState).toBe("unavailable");
	});

	it("sets zip location", () => {
		const { result } = renderHook(() => useGeolocation());

		act(() => {
			result.current.setZipLocation("92101", {
				lat: 32.7195,
				lng: -117.1628,
			});
		});

		expect(result.current.coordinates).toEqual({
			lat: 32.7195,
			lng: -117.1628,
		});
		expect(result.current.source).toBe("zip");
		expect(result.current.zipCode).toBe("92101");
	});

	it("clears location", async () => {
		mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
			success({
				coords: { latitude: 32.72, longitude: -117.16 },
			} as GeolocationPosition);
		});

		const { result } = renderHook(() => useGeolocation());

		await act(async () => {
			result.current.requestPermission();
		});

		expect(result.current.coordinates).not.toBeNull();

		act(() => {
			result.current.clearLocation();
		});

		expect(result.current.coordinates).toBeNull();
		expect(result.current.source).toBeNull();
		expect(result.current.zipCode).toBeNull();
	});

	it("auto-fetches when permission already granted on mount", async () => {
		mockPermissionsQuery.mockResolvedValue({ state: "granted" });
		mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
			success({
				coords: { latitude: 32.72, longitude: -117.16 },
			} as GeolocationPosition);
		});

		let hookResult: ReturnType<typeof useGeolocation>;
		await act(async () => {
			const { result } = renderHook(() => useGeolocation());
			hookResult = result.current;
		});

		// Re-render to get updated state after the effect runs
		const { result } = renderHook(() => useGeolocation());
		// The mock has been called which means auto-fetch triggered
		expect(mockGetCurrentPosition).toHaveBeenCalled();
	});

	it("sets denied state when permission is denied on mount", async () => {
		mockPermissionsQuery.mockResolvedValue({ state: "denied" });

		const { result } = renderHook(() => useGeolocation());

		// Wait for the permissions query promise to resolve
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.permissionState).toBe("denied");
	});
});
