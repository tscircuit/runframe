import winterspecBundle from "@tscircuit/file-server/dist/bundle"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { type Plugin, defineConfig } from "vite"
import { getNodeHandler } from "winterspec/adapters/node"
import {} from "@tscircuit/fake-snippets"

const fileServerHandler = getNodeHandler(winterspecBundle as any, {})

function fileServerPlugin(): Plugin {
  return {
    name: "file-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          req.url = req.url.replace("/api/", "/")
          fileServerHandler(req, res)
        } else {
          next()
        }
      })
    },
  }
}

const plugins: any[] = [react()]

if (!process.env.VERCEL && !process.env.STANDALONE) {
  plugins.push(fileServerPlugin())
}

let build: any = undefined

if (process.env.STANDALONE === "1") {
  build = {
    // metafile: "./metafile.json",
    lib: {
      entry: resolve(
        __dirname,
        "lib/components/RunFrameWithApi/standalone.tsx",
      ),
      name: "standalone",
      fileName: (format) => `standalone.min.js`,
      formats: ["umd"],
    },
    minify: true,
  }
}

if (process.env.STANDALONE === "iframe") {
  build = {
    lib: {
      entry: resolve(__dirname, "lib/entrypoints/iframe.html"),
      name: "iframe",
      fileName: (format) => `iframe.min.js`,
      formats: ["umd"],
    },
    minify: true,
  }
}

if (process.env.STANDALONE === "preview") {
  build = {
    lib: {
      entry: resolve(
        __dirname,
        "lib/components/CircuitJsonPreviewStandalone/standalone-preview.tsx",
      ),
      name: "standalone-preview",
      fileName: (format) => `standalone-preview.min.js`,
      formats: ["umd"],
    },
    minify: true,
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
      process: {
        env: {},
      },
    },
  },
  root: ".",
  publicDir: "public",
  build,
})
