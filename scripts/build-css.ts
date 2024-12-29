import fs from "node:fs"
import postcss from "postcss"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import cssnano from "cssnano"
import tailwindConfig from "../tailwind.config"

async function buildCss() {
  // Read your base CSS file with @tailwind directives
  const css = "@tailwind utilities;"

  const result = await postcss([
    tailwindcss({
      ...tailwindConfig,
      content: [],
      corePlugins: {
        preflight: false,
        // Only enable animation related plugins
        animation: true,
      },
    }),
    autoprefixer,
    cssnano,
  ]).process(css, {
    from: undefined,
  })

  fs.writeFileSync(
    "./lib/hooks/styles.generated.ts",
    `export default \`${result.css.replace(/\\/g, "\\\\")}\``,
  )
}

buildCss()
