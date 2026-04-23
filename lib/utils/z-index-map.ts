export const zIndexMap = {
  importComponentDialog: 101,
  importComponentDetailsDialog: 102,
} as const

export type ZIndexKey = keyof typeof zIndexMap
