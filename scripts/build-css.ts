import fs from "node:fs"
import postcss from "postcss"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import cssnano from "cssnano"
import tailwindConfig from "../tailwind.config"

async function buildCss() {
  // Read your base CSS file with @tailwind directives
  const css = `
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  :root {
    --radius: 0.5rem
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
}
`

  const result = await postcss([
    tailwindcss(tailwindConfig),
    autoprefixer,
    cssnano,
  ]).process(css, {
    from: undefined,
  })

  fs.writeFileSync(
    "./lib/hooks/styles.generated.ts",
    `export default ${JSON.stringify(result.css)}`,
  )

  // The debugger uses unprefixed utilities. Scope its prebuilt stylesheet to
  // the debugger container instead of downloading the Tailwind runtime.
  const solverResult = await postcss([
    tailwindcss({
      ...tailwindConfig,
      prefix: "",
      important: ".rf-solver-debugger",
      corePlugins: { preflight: false },
      content: [
        "./node_modules/@tscircuit/solver-utils/dist/react/**/*.js",
        "./node_modules/graphics-debug/dist/**/*.js",
      ],
    }),
    autoprefixer,
    cssnano,
  ]).process("@tailwind utilities;", { from: undefined })

  fs.writeFileSync(
    "./lib/hooks/solver-styles.generated.ts",
    `export default ${JSON.stringify(solverResult.css)}`,
  )
}

buildCss()
