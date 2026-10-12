export const getStepConverter = async () => {
  // Bundle the converter lazily; its CDN bundle's JSCAD dependency fails to load.
  return await import("circuit-json-to-step")
}
