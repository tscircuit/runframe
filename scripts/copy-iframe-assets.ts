import { copyFileSync } from "node:fs"

copyFileSync("./dist/lib/entrypoints/iframe.html", "./dist/iframe.html")
copyFileSync("./dist/iframe.html", "./cosmos-export/iframe.html")
copyFileSync("./dist/iframe.min.js", "./cosmos-export/iframe.min.js")
