import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			// react-hooks v7 (pulled in by eslint-config-next 16.2) flags every
			// synchronous setState in an effect. Our usages are intentional
			// mount-time syncs (matchMedia), pre-async loading flags, and
			// prop-driven state transitions — not cascading-render bugs. Keep
			// as a warning for visibility without blocking the build.
			"react-hooks/set-state-in-effect": "warn",
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
		// Node CLI data-tooling — not Next app code; the web-vitals/react
		// ruleset produces false positives here (e.g. hook-name heuristics).
		"scripts/**",
	]),
]);

export default eslintConfig;
