import type { PlatformConfig } from "@tscircuit/props"
import type { RunFrameWithApiProps } from "../../lib/components/RunFrameWithApi/RunFrameWithApi"
import { registerFixtureFakes } from "./register-fixture-fakes"

export const fakeEvaluator = {
  workers: [] as {
    options: unknown
    killed: boolean
    kill: () => Promise<void>
  }[],
  async createWorker(options: unknown) {
    const worker = {
      options,
      killed: false,
      async kill() {
        this.killed = true
      },
    }
    this.workers.push(worker)
    return worker
  },
}
export const previewConfigs: (PlatformConfig | undefined)[] = []
export const cliConfigs: RunFrameWithApiProps[] = []
const fakeSchematicController = {
  focusRequest: null as { schematicComponentId: string } | null,
  onFocusRequestHandled() {
    this.focusRequest = null
  },
}

registerFixtureFakes({
  "lib/components/RunFrameWithApi/RunFrameWithApi": {
    RunFrameWithApi: (props: RunFrameWithApiProps) => {
      cliConfigs.push(props)
      return null
    },
  },
  "@tscircuit/eval/worker": {
    createCircuitWebWorker: (options: unknown) =>
      fakeEvaluator.createWorker(options),
  },
  "@tscircuit/schematic-viewer": {
    useSchematicViewerController: () => ({
      controller: fakeSchematicController,
      focusSchematicComponent: (schematicComponentId: string) => {
        fakeSchematicController.focusRequest = { schematicComponentId }
      },
    }),
    AnalogSimulationViewer: () => null,
    SchematicViewer: ({
      platformConfig,
    }: { platformConfig?: PlatformConfig }) => {
      previewConfigs.push(platformConfig)
      return <div data-testid="schematic-viewer" />
    },
  },
})
