import type { AnyCircuitElement } from "circuit-json"
import type { JlcpcbComponentSummary } from "../../lib/components/ImportComponentDialog2/types"
import { registerFixtureFakes } from "./register-fixture-fakes"

const fakeFileServer = {
  files: new Map<string, string>(),
  writes: [] as string[],
  async upsertFile(path: string, tsx: string) {
    this.files.set(path, tsx)
    this.writes.push(path)
  },
}
const registryImports: unknown[] = []
const supplierImports: unknown[] = []
const kicadImports: unknown[] = []
const datasheetImports: unknown[] = []
const registryImport = async (value: unknown) => {
  registryImports.push(value)
}
const supplierImport = async (value: unknown) => {
  supplierImports.push(value)
}
const kicadImport = async (value: unknown) => {
  kicadImports.push(value)
}
const fakeSupplier = {
  components: null as JlcpcbComponentSummary[] | null,
  searches: [] as string[],
  loads: [] as string[],
  previews: [] as string[],
  pendingTsx: null as Promise<string> | null,
  async search(query: string) {
    this.searches.push(query)
    if (!this.components) throw new Error("Unexpected JLC search")
    return this.components
  },
  async load(partNumber: string) {
    this.loads.push(partNumber)
    if (!this.pendingTsx) throw new Error("Unexpected EasyEDA import")
    return this.pendingTsx
  },
  async preview(partNumber: string): Promise<AnyCircuitElement[]> {
    this.previews.push(partNumber)
    if (!this.components) throw new Error("Unexpected EasyEDA preview")
    return []
  },
}
const kicadRequests: string[] = []
const previewJson: unknown[] = []

registerFixtureFakes({
  "lib/components/RunFrameWithApi/store": {
    useRunFrameStore: (selector: (store: unknown) => unknown) =>
      selector({
        upsertFile: (path: string, tsx: string) =>
          fakeFileServer.upsertFile(path, tsx),
        pushEvent: registryImport,
      }),
  },
  "lib/utils/toast": {
    toast: { promise: async (promise: Promise<unknown>) => await promise },
  },
  "lib/components/ImportComponentDialog2/api/tscircuit": {
    searchTscircuitPackages: async () => [
      {
        package_id: "remote-package",
        org_owner_tscircuit_handle: "example",
        unscoped_name: "RemoteComponent",
        name: "example/RemoteComponent",
        description: "Online result",
      },
    ],
  },
  "lib/components/ImportComponentDialog2/api/jlcpcb": {
    searchJlcpcbComponents: (query: string) => fakeSupplier.search(query),
    mapJlcpcbComponentToSummary: (value: unknown) => value,
    loadJlcpcbComponentTsx: (partNumber: string) =>
      fakeSupplier.load(partNumber),
    loadJlcpcbComponentCircuitJson: (partNumber: string) =>
      fakeSupplier.preview(partNumber),
  },
  "lib/components/ImportComponentDialog2/api/kicad": {
    searchKicadFootprints: async (query: string) => {
      kicadRequests.push(query)
      throw new Error("Unexpected KiCad search")
    },
    mapKicadFootprintToSummary: (value: unknown) => value,
    loadKicadFootprintCircuitJson: async (path: string) => {
      kicadRequests.push(path)
      throw new Error("Unexpected KiCad preview")
    },
  },
  "@tscircuit/pcb-viewer": {
    PCBViewer: ({ circuitJson }: { circuitJson: unknown }) => {
      previewJson.push(circuitJson)
      return (
        <pre data-testid="local-preview">{JSON.stringify(circuitJson)}</pre>
      )
    },
  },
})

export {
  fakeFileServer,
  registryImports,
  supplierImports,
  kicadImports,
  datasheetImports,
  registryImport,
  supplierImport,
  kicadImport,
  fakeSupplier,
  kicadRequests,
  previewJson,
}
