import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import winterspecBundle from "@tscircuit/file-server/dist/bundle"
import { getNodeHandler } from "winterspec/adapters/node"
import { visualizer } from "rollup-plugin-visualizer"

const fakeHandler = getNodeHandler(winterspecBundle as any, {})

function apiServerPlugin(): Plugin {
  return {
    name: "api-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          req.url = req.url.replace("/api/", "/")
          fakeHandler(req, res)
        } else {
          next()
        }
      })
    },
  }
}

const plugins: any[] = [react()]

if (!process.env.VERCEL && !process.env.STANDALONE) {
  plugins.push(apiServerPlugin())
}

let build: any = undefined

if (process.env.STANDALONE) {
  // plugins.push(
  //   visualizer({
  //     filename: "stats.html",
  //     open: true, // Will open the stats.html file after build
  //     gzipSize: true,
  //     brotliSize: true,
  //   }),
  // )
  build = {
    lib: {
      entry: resolve(__dirname, "src/main.tsx"),
      name: "standalone",
      fileName: (format) => `standalone.min.js`,
      formats: ["umd"],
    },
    minify: true,
    // reportCompressedSize: true,
  }
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      lib: resolve(__dirname, "./lib"),
    },
  },
  define: {
    global: {
      process: {},
    },
  },
  root: ".",
  publicDir: "public",
  build,
})
