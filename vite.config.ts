import winterspecBundle from "@tscircuit/file-server/dist/bundle"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { type Plugin, defineConfig } from "vite"
import { getNodeHandler } from "winterspec/adapters/node"
import fakeRegistryBundle from "@tscircuit/fake-snippets/bundle"
import { createDatabase } from "@tscircuit/fake-snippets"
import ky from "ky"
import { nodePolyfills } from "vite-plugin-node-polyfills"

const registryDb = createDatabase()

const fileServerHandler = getNodeHandler(winterspecBundle as any, {})
const fakeRegistryHandler = getNodeHandler(fakeRegistryBundle as any, {
  middleware: [
    (req, ctx, next) => {
      ;(ctx as any).db = registryDb
      return next(req, ctx)
    },
  ],
})

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

function fakeRegistryPlugin(): Plugin {
  let initialized = false
  return {
    name: "fake-registry",
    async configureServer(server) {
      const port = server.config.server.port
      server.middlewares.use(async (req, res, next) => {
        if (process.env.REGISTRY_API_BASE_URL) {
          // TODO Proxy requests to the registry API base URL
        }
        if (req.url?.startsWith("/registry/")) {
          if (!initialized) {
            initialized = true
            await ky.post(`http://localhost:${port}/registry/_fake/seed`)
          }
          req.url = `/api/${req.url.replace("/registry/", "")}`
          fakeRegistryHandler(req, res)
        } else {
          next()
        }
      })
    },
  }
}

const plugins: any[] = [react(), nodePolyfills()]

if (!process.env.VERCEL && !process.env.STANDALONE) {
  plugins.push(fileServerPlugin())
  plugins.push(fakeRegistryPlugin())
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
    process: {
      env: {},
      version: "",
    },
  },
  root: ".",
  publicDir: "public",
  build,
})
