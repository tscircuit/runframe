import fs from "node:fs"
import postcss from "postcss"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import cssnano from "cssnano"
import tailwindConfig from "../tailwind.config"

async function buildCss() {
  // Read your base CSS file with @tailwind directives
  const css = "@tailwind base; @tailwind components; @tailwind utilities;"

  const result = await postcss([
    tailwindcss(tailwindConfig),
    // autoprefixer,
    // cssnano,
  ]).process(css, {
    from: undefined,
  })

  fs.writeFileSync(
    "./lib/hooks/styles.generated.ts",
    `export default ${JSON.stringify(result.css)}`,
  )
}

buildCss()
