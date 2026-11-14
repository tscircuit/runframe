export const zIndexMap = {
  importComponentDialog: 101,
  importComponentDetailsDialog: 102,
  promptGeneratorOverlay: 119,
  promptGeneratorDialog: 120,
} as const

export type ZIndexKey = keyof typeof zIndexMap
