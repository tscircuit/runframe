import fs from "node:fs"
import postcss from "postcss"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import cssnano from "cssnano"

async function buildCSS() {
  // Read your base CSS file with @tailwind directives
  const css = "@tailwind components; @tailwind utilities;"

  const result = await postcss([tailwindcss, autoprefixer, cssnano]).process(
    css,
    {
      from: undefined,
    },
  )

  fs.writeFileSync("./dist/styles.css", result.css)
}

buildCSS()
