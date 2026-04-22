export const zIndexMap = {
  dialog: 101,
  dialogAbove: 102,
} as const

export type ZIndexKey = keyof typeof zIndexMap
