import type { DatasheetGeneration } from "../../ai/datasheet-generation"
import type { DatasheetUsageKind } from "../../ai/datasheet-assets"
import { Activity, CircuitBoard, Cpu } from "lucide-react"
export type DatasheetPlacement = {
  source: string
  boardPath: string
  entrypoints?: ReadonlySet<string>
}
export type GenerationView = {
  generation: DatasheetGeneration
  saved: boolean
  added: Set<DatasheetUsageKind>
  addedIn?: { source: string; boardPath: string }
}
export const targets = [
  { kind: "component", label: "Chip", icon: Cpu },
  { kind: "simulationCircuit", label: "Simulation circuit", icon: Activity },
  { kind: "referenceCircuit", label: "Reference circuit", icon: CircuitBoard },
] as const

export const getGenerationViews = (
  savedGenerations: readonly DatasheetGeneration[],
  localRecords: readonly GenerationView[],
  placement?: DatasheetPlacement,
): GenerationView[] => {
  const merged = new Map(
    savedGenerations.map((generation) => [
      generation.id,
      {
        generation,
        saved: true,
        added: new Set<DatasheetUsageKind>(),
      } as GenerationView,
    ]),
  )
  for (const record of localRecords) {
    const saved = merged.get(record.generation.id)
    merged.set(
      record.generation.id,
      saved ? { ...record, generation: saved.generation, saved: true } : record,
    )
  }
  return [...merged.values()]
    .sort((a, b) =>
      a.generation.createdAt.localeCompare(b.generation.createdAt),
    )
    .map((record) => {
      if (!placement?.entrypoints) return record
      const current = targets
        .filter(({ kind }) => {
          const asset = record.generation.assets[kind]
          return (
            asset &&
            placement.entrypoints!.has(
              `${record.generation.directory}/${asset.filename}`,
            )
          )
        })
        .map(({ kind }) => kind)
      const acknowledged =
        record.addedIn?.source === placement.source &&
        record.addedIn.boardPath === placement.boardPath
      return {
        ...record,
        added: new Set(acknowledged ? [...record.added, ...current] : current),
      }
    })
}
