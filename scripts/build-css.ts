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
}

buildCss()
