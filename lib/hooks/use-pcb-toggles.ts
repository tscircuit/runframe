import { useState } from "react"

export const PCB_TOGGLE_KEYS = [
  "showPcbSolderMask",
  "showPcbAllTraceLength",
  "showPcbAutoroutingAnimation",
  "showPcbDrcError",
  "showPcbCopperPour",
  "showPcbGroupAnchorOffsets",
  "showPcbGroup",
] as const

export type PcbToggleKeys = (typeof PCB_TOGGLE_KEYS)[number]
export type PcbToggleValues = Record<PcbToggleKeys, boolean>
export type PcbToggleSetters = {
  [K in PcbToggleKeys as `set${Capitalize<string & K>}`]: (v: boolean) => void
}
export type PcbToggleHandlers = {
  [K in PcbToggleKeys as `onChange${Capitalize<string & K>}`]?: (v: boolean) => void
}

const toHandlerKey = (k: PcbToggleKeys) =>
  `onChange${k[0].toUpperCase()}${k.slice(1)}` as keyof PcbToggleHandlers

const toSetterKey = (k: PcbToggleKeys) =>
  `set${k[0].toUpperCase()}${k.slice(1)}`

export function usePcbToggles(
  props: PcbToggleValues & PcbToggleHandlers,
): PcbToggleValues & PcbToggleSetters {
  const [internal, setInternal] = useState<PcbToggleValues>(() =>
    Object.fromEntries(PCB_TOGGLE_KEYS.map((k) => [k, props[k]])) as PcbToggleValues,
  )

  return Object.fromEntries(
    PCB_TOGGLE_KEYS.flatMap((k) => {
      const handler = props[toHandlerKey(k)] as ((v: boolean) => void) | undefined
      return [
        [k, handler ? props[k] : internal[k]],
        [toSetterKey(k), (v: boolean) => handler ? handler(v) : setInternal((s) => ({ ...s, [k]: v }))],
      ]
    }),
  ) as PcbToggleValues & PcbToggleSetters
}
