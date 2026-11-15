/**
 * A warning element can carry an `error_type` field. For example
 * `source_property_ignored_warning` sets `error_type` to its own type. So a
 * plain `"error_type" in element` check wrongly classifies warnings as errors
 * and sends them to error tracking. These helpers keep warnings and errors
 * apart with one shared rule: an element is a warning when its `type` ends in
 * `_warning` or it has a `warning_type` field.
 */

export const isCircuitJsonWarning = (element: any): boolean =>
  Boolean(element) &&
  (String(element.type).endsWith("_warning") || "warning_type" in element)

export const isCircuitJsonError = (element: any): boolean =>
  Boolean(element) &&
  !isCircuitJsonWarning(element) &&
  ("error_type" in element || String(element.type).includes("error"))
