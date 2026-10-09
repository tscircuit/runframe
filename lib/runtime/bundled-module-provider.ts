import type {
  RunFrameModuleMap,
  RunFrameModuleName,
  RunFrameModuleProvider,
} from "./types"

export class OfflineModuleUnavailableError extends Error {
  constructor(readonly moduleName: RunFrameModuleName) {
    super(`Module "${moduleName}" is not included in this offline build.`)
    this.name = "OfflineModuleUnavailableError"
  }
}

export const createBundledModuleProvider = (
  modules: Partial<RunFrameModuleMap>,
): RunFrameModuleProvider => {
  // Snapshot the registry so a caller cannot replace modules after mounting.
  const bundled = { ...modules }
  return {
    async load<K extends RunFrameModuleName>(name: K) {
      const module = Object.hasOwn(bundled, name) ? bundled[name] : undefined
      if (!module) throw new OfflineModuleUnavailableError(name)
      return module as RunFrameModuleMap[K]
    },
  }
}
