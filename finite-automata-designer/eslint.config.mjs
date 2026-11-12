import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Next.js defaults
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Rollup output for the canvas bundles (generated from public/scripts/**/*.ts)
    "public/scripts/dfsm/dfsmCanvas.js",
    "public/scripts/ndfsm/ndfsmCanvas.js",
    ".rollup.cache/**",
    // Not covered by the old `next lint` (it only linted src/). Ignored for
    // now so the Next 16 upgrade doesn't change lint scope; remove these two
    // lines to start linting the canvas source and rollup configs.
    "public/scripts/**",
    "rollup.*.config.js",
  ]),
  {
    // New in eslint-plugin-react-hooks v7 (via eslint-config-next 16). Flags
    // existing prop->state sync effects in the editor/project modals.
    // Downgraded to a warning until those components are refactored.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
