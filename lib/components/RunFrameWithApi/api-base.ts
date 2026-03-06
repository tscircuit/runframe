export const API_BASE =
  typeof window !== "undefined"
    ? (window.TSCIRCUIT_FILESERVER_API_BASE_URL ?? "/api")
    : "/api"
