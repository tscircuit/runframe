export interface AutoroutingLogEntry {
  simpleRouteJson: any
  createdAt?: number | string
}

const BOARD_NUMBER_REGEX = /#(\d+)/

const getBoardNumberFromKey = (key: string): number | null => {
  const match = key.match(BOARD_NUMBER_REGEX)
  if (!match) return null
  const boardNumber = Number.parseInt(match[1], 10)
  return Number.isFinite(boardNumber) ? boardNumber : null
}

const getCreatedAtTimestamp = (createdAt?: number | string): number | null => {
  if (typeof createdAt === "number") {
    return Number.isFinite(createdAt) ? createdAt : null
  }
  if (typeof createdAt === "string") {
    const timestamp = new Date(createdAt).getTime()
    return Number.isFinite(timestamp) ? timestamp : null
  }
  return null
}

export const getLatestAutoroutingLogEntry = (
  autoroutingLog?: Record<string, AutoroutingLogEntry>,
): { key: string; value: AutoroutingLogEntry } | null => {
  if (!autoroutingLog) return null

  let latestEntry: { key: string; value: AutoroutingLogEntry } | null = null
  let latestBoardNumber = -1
  let latestCreatedAt = -1

  for (const [key, value] of Object.entries(autoroutingLog)) {
    const boardNumber = getBoardNumberFromKey(key)
    const createdAt = getCreatedAtTimestamp(value.createdAt)

    if (boardNumber !== null) {
      if (boardNumber > latestBoardNumber) {
        latestBoardNumber = boardNumber
        latestEntry = { key, value }
      }
      continue
    }

    if (latestBoardNumber !== -1) {
      continue
    }

    if (createdAt !== null && createdAt > latestCreatedAt) {
      latestCreatedAt = createdAt
      latestEntry = { key, value }
      continue
    }

    if (!latestEntry) {
      latestEntry = { key, value }
    }
  }

  return latestEntry
}
