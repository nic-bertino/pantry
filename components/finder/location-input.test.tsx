import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from "vitest";
import { LocationInput } from "./location-input";

// Mock motion — render children immediately without animation
vi.mock("motion/react", () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	motion: {
		div: ({
			children,
			initial: _i,
			animate: _a,
			exit: _e,
			transition: _t,
			...rest
		}: React.ComponentProps<"div"> & Record<string, unknown>) => (
			<div {...rest}>{children}</div>
		),
	},
}));

// Mock translations — return key as-is for easy assertions
vi.mock("@/lib/i18n/use-translations", () => ({
	useTranslations: () => ({
		t: (key: string, vars?: Record<string, string | number>) => {
			if (vars) {
				let text = key;
				for (const [k, v] of Object.entries(vars)) {
					text = text.replace(`{${k}}`, String(v));
				}
				return text;
			}
			return key;
		},
	}),
}));

// Mock zip lookup
vi.mock("@/lib/geo/zip-lookup", () => ({
	isValidZipFormat: (zip: string) => /^\d{5}$/.test(zip),
	getCoordinatesForZip: (zip: string) => {
		if (zip === "92101") return { lat: 32.72, lng: -117.16 };
		return null;
	},
}));

const defaultProps = {
	coordinates: null,
	source: null as "browser" | "zip" | null,
	zipCode: null as string | null,
	permissionState: "prompt" as const,
	isLoading: false,
	error: null as string | null,
	onRequestBrowserLocation: vi.fn(),
	onSetZipLocation: vi.fn(),
	onClearLocation: vi.fn(),
};

function renderInput(overrides: Partial<typeof defaultProps> = {}) {
	const props = { ...defaultProps, ...overrides };
	// Reset mocks on each render
	if (!overrides.onRequestBrowserLocation)
		props.onRequestBrowserLocation = vi.fn();
	if (!overrides.onSetZipLocation) props.onSetZipLocation = vi.fn();
	if (!overrides.onClearLocation) props.onClearLocation = vi.fn();
	return { ...render(<LocationInput {...props} />), props };
}

describe("LocationInput", () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
	});

	describe("trigger pill", () => {
		it("shows 'setLocation' when no location is set", () => {
			renderInput();
			expect(screen.getByText("setLocation")).toBeTruthy();
		});

		it("shows '...' when loading", () => {
			renderInput({ isLoading: true });
			expect(screen.getByText("...")).toBeTruthy();
		});

		it("shows 'nearYou' when browser location is set", () => {
			renderInput({
				coordinates: { lat: 32.72, lng: -117.16 },
				source: "browser",
			});
			expect(screen.getByText("nearYou")).toBeTruthy();
		});

		it("shows 'nearZip' with zip code when zip location is set", () => {
			renderInput({
				coordinates: { lat: 32.72, lng: -117.16 },
				source: "zip",
				zipCode: "92101",
			});
			expect(screen.getByText("nearZip")).toBeTruthy();
		});

		it("shows spinner icon when loading", () => {
			const { container } = renderInput({ isLoading: true });
			const spinner = container.querySelector(".animate-spin");
			expect(spinner).toBeTruthy();
		});
	});

	describe("browser location flow", () => {
		it("shows loading state when 'Use my location' is clicked", async () => {
			renderInput();

			// Open popover
			fireEvent.click(screen.getByText("setLocation"));

			// Click "Use my location"
			fireEvent.click(screen.getByText("useMyLocation"));

			// Should show loading state inside popover
			expect(screen.getByText("locatingYou")).toBeTruthy();
		});

		it("calls onRequestBrowserLocation when clicked", () => {
			const onRequest = vi.fn();
			renderInput({ onRequestBrowserLocation: onRequest });

			fireEvent.click(screen.getByText("setLocation"));
			fireEvent.click(screen.getByText("useMyLocation"));

			expect(onRequest).toHaveBeenCalledOnce();
		});

		it("does NOT close popover when browser location is requested", () => {
			renderInput();

			fireEvent.click(screen.getByText("setLocation"));
			fireEvent.click(screen.getByText("useMyLocation"));

			// Popover should still be open (loading state visible)
			expect(screen.getByText("locatingYou")).toBeTruthy();
		});

		it("transitions to success when coordinates arrive", () => {
			const { rerender } = render(
				<LocationInput
					{...defaultProps}
					isLoading={false}
					error={null}
					coordinates={null}
				/>,
			);

			// Open popover and click use my location
			fireEvent.click(screen.getByText("setLocation"));
			fireEvent.click(screen.getByText("useMyLocation"));

			// Simulate loading state from hook
			rerender(
				<LocationInput
					{...defaultProps}
					isLoading={true}
					error={null}
					coordinates={null}
				/>,
			);

			// Coordinates arrive, loading stops
			rerender(
				<LocationInput
					{...defaultProps}
					isLoading={false}
					error={null}
					coordinates={{ lat: 32.72, lng: -117.16 }}
					source="browser"
				/>,
			);

			// Should show success state
			expect(screen.getByText("locationSet")).toBeTruthy();
		});

		it("auto-closes popover after success", () => {
			const { rerender } = render(
				<LocationInput {...defaultProps} />,
			);

			fireEvent.click(screen.getByText("setLocation"));
			fireEvent.click(screen.getByText("useMyLocation"));

			// Simulate loading then success
			rerender(
				<LocationInput {...defaultProps} isLoading={true} />,
			);
			rerender(
				<LocationInput
					{...defaultProps}
					isLoading={false}
					coordinates={{ lat: 32.72, lng: -117.16 }}
					source="browser"
				/>,
			);

			expect(screen.getByText("locationSet")).toBeTruthy();

			// Advance past the 1.5s timer
			act(() => {
				vi.advanceTimersByTime(1600);
			});

			// Success text should be gone (popover closed)
			expect(screen.queryByText("locationSet")).toBeNull();
		});
	});

	describe("error states", () => {
		it("shows error with retry button for retryable errors", () => {
			const { rerender } = render(
				<LocationInput {...defaultProps} />,
			);

			fireEvent.click(screen.getByText("setLocation"));
			fireEvent.click(screen.getByText("useMyLocation"));

			rerender(
				<LocationInput {...defaultProps} isLoading={true} />,
			);
			rerender(
				<LocationInput
					{...defaultProps}
					isLoading={false}
					error="Location unavailable - try again"
				/>,
			);

			expect(screen.getByText("locationUnavailable")).toBeTruthy();
			expect(screen.getByText("retry")).toBeTruthy();
		});

		it("shows settings hint for permission denied", () => {
			const { rerender } = render(
				<LocationInput {...defaultProps} />,
			);

			fireEvent.click(screen.getByText("setLocation"));
			fireEvent.click(screen.getByText("useMyLocation"));

			rerender(
				<LocationInput {...defaultProps} isLoading={true} />,
			);
			rerender(
				<LocationInput
					{...defaultProps}
					isLoading={false}
					error="Location permission denied"
					permissionState="denied"
				/>,
			);

			expect(screen.getByText("locationDenied")).toBeTruthy();
			expect(screen.getByText("enableInSettings")).toBeTruthy();
			expect(screen.queryByText("retry")).toBeNull();
		});

		it("retry button triggers another location request", () => {
			const onRequest = vi.fn();
			const { rerender } = render(
				<LocationInput
					{...defaultProps}
					onRequestBrowserLocation={onRequest}
				/>,
			);

			fireEvent.click(screen.getByText("setLocation"));
			fireEvent.click(screen.getByText("useMyLocation"));

			rerender(
				<LocationInput
					{...defaultProps}
					isLoading={true}
					onRequestBrowserLocation={onRequest}
				/>,
			);
			rerender(
				<LocationInput
					{...defaultProps}
					isLoading={false}
					error="Location request timed out"
					onRequestBrowserLocation={onRequest}
				/>,
			);

			fireEvent.click(screen.getByText("retry"));
			// First call from initial click, second from retry
			expect(onRequest).toHaveBeenCalledTimes(2);
		});
	});

	describe("ZIP code flow", () => {
		it("shows success feedback after valid ZIP submission", () => {
			renderInput();

			fireEvent.click(screen.getByText("setLocation"));

			const input = screen.getByPlaceholderText("92101");
			fireEvent.change(input, { target: { value: "92101" } });
			fireEvent.click(screen.getByText("update"));

			expect(screen.getByText("locationSet")).toBeTruthy();
		});

		it("auto-closes after ZIP success", () => {
			renderInput();

			fireEvent.click(screen.getByText("setLocation"));

			const input = screen.getByPlaceholderText("92101");
			fireEvent.change(input, { target: { value: "92101" } });
			fireEvent.click(screen.getByText("update"));

			act(() => {
				vi.advanceTimersByTime(1600);
			});

			expect(screen.queryByText("locationSet")).toBeNull();
		});

		it("shows error for invalid ZIP", () => {
			renderInput();

			fireEvent.click(screen.getByText("setLocation"));

			const input = screen.getByPlaceholderText("92101");
			fireEvent.change(input, { target: { value: "abc" } });
			fireEvent.click(screen.getByText("update"));

			expect(screen.getByText("invalidZip")).toBeTruthy();
		});
	});

	describe("clear location", () => {
		it("shows clear button when location is set", () => {
			renderInput({
				coordinates: { lat: 32.72, lng: -117.16 },
				source: "browser",
			});

			fireEvent.click(screen.getByText("nearYou"));

			expect(screen.getByText("clearLocation")).toBeTruthy();
		});

		it("does not show clear button when no location is set", () => {
			renderInput();

			fireEvent.click(screen.getByText("setLocation"));

			expect(screen.queryByText("clearLocation")).toBeNull();
		});

		it("calls onClearLocation and closes popover when clicked", () => {
			const onClear = vi.fn();
			renderInput({
				coordinates: { lat: 32.72, lng: -117.16 },
				source: "browser",
				onClearLocation: onClear,
			});

			fireEvent.click(screen.getByText("nearYou"));
			fireEvent.click(screen.getByText("clearLocation"));

			expect(onClear).toHaveBeenCalledOnce();
			// Popover should close
			expect(screen.queryByText("clearLocation")).toBeNull();
		});
	});

	describe("browser option visibility", () => {
		it("hides browser option when permission is denied", () => {
			renderInput({ permissionState: "denied" });

			fireEvent.click(screen.getByText("setLocation"));

			expect(screen.queryByText("useMyLocation")).toBeNull();
		});

		it("shows browser option when permission is prompt", () => {
			renderInput({ permissionState: "prompt" });

			fireEvent.click(screen.getByText("setLocation"));

			expect(screen.getByText("useMyLocation")).toBeTruthy();
		});
	});
});
