import { fp } from "@tscircuit/footprinter"
import { pinAttributeMap } from "@tscircuit/props"
import type { PinAttributeMap } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { z } from "zod"
import type { AdaptedCachedDatasheet, CachedDatasheet } from "./types"

const cachedDatasheetSchema = z.object({
  datasheet_id: z.string().uuid(),
  chip_name: z.string().trim().min(1),
  ai_description: z.string().nullish(),
  footprinter_string: z.string().trim().min(1).max(8192),
  pin_information: z
    .array(
      z.object({
        pin_number: z.string().trim().min(1),
        name: z.array(z.string().trim().min(1)),
        description: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  pin_attributes: z.record(pinAttributeMap).nullish(),
})

const invalid = (message: string): never => {
  throw new Error(`Cached datasheet cannot be imported: ${message}`)
}

const physicalId = (value: string) => {
  const id = value.replace(/^pin/i, "")
  return /^\d+$/.test(id) ? String(Number(id)) : id.toUpperCase()
}

/** Preserve distinct punctuation-bearing signals as usable core selectors. */
const makeSelectors = (names: string[]): Map<string, string> => {
  const selectors = new Map<string, string>()
  const used = new Set<string>()
  const unique = [...new Set(names)].sort()
  for (const name of unique.filter((name) => /^[A-Za-z0-9_]+$/.test(name))) {
    selectors.set(name, name)
    used.add(name)
  }
  for (const name of unique.filter((name) => !selectors.has(name))) {
    let selector = name.replace(
      /[^A-Za-z0-9_]/g,
      (character) => `_u${character.codePointAt(0)!.toString(16)}_`,
    )
    while (used.has(selector)) selector += "_"
    selectors.set(name, selector)
    used.add(selector)
  }
  return selectors
}

const componentNameFor = (name: string): string => {
  const identifier = name.replace(
    /[^A-Za-z0-9]/g,
    (character) => `_u${character.codePointAt(0)!.toString(16)}_`,
  )
  return /^[A-Z]/.test(identifier) ? identifier : `Part_${identifier}`
}

const parseFootprint = (recipe: string): AnyCircuitElement[] => {
  if (
    !/^[a-z][a-zA-Z0-9.,()+_-]*$/.test(recipe) ||
    /padlayout|profile\(/i.test(recipe)
  ) {
    return invalid("footprinter_string must be a supported local recipe")
  }
  try {
    const circuitJson = fp.string(recipe).circuitJson()
    if (
      !circuitJson.some(
        (element) =>
          element.type === "pcb_smtpad" || element.type === "pcb_plated_hole",
      )
    ) {
      return invalid("footprint has no copper pads")
    }
    return circuitJson
  } catch (error) {
    return invalid(
      `footprint could not be generated: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Adapt an API envelope or cached record without evaluating generated_tsx.
 * Every copper pad and declared physical terminal must have an unambiguous
 * mapping. Named package terminals (including BGA balls) retain their aliases;
 * numeric Footprinter hints select their core source-port ordinals.
 */
export const adaptCachedDatasheet = (
  input: unknown,
): AdaptedCachedDatasheet => {
  const raw =
    input && typeof input === "object" && "datasheet" in input
      ? input.datasheet
      : input
  const parsed = cachedDatasheetSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!
    return invalid(`${issue.path.join(".") || "record"}: ${issue.message}`)
  }
  const datasheet: CachedDatasheet = parsed.data
  const footprintCircuitJson = parseFootprint(datasheet.footprinter_string)
  const pins = datasheet.pin_information
  const physicalOwners = new Map<string, number>()
  pins.forEach((pin, index) => {
    if (!/^(?:\d+|[A-Za-z][A-Za-z0-9_]*)$/.test(pin.pin_number)) {
      return invalid(`unsupported physical pin ${pin.pin_number}`)
    }
    const id = physicalId(pin.pin_number)
    if (physicalOwners.has(id)) return invalid(`duplicate physical pin ${id}`)
    physicalOwners.set(id, index)
  })

  const padOwners = new Map<AnyCircuitElement, number>()
  const ordinalHints = new Map<number, Set<number>>()
  const mappedPins = new Set<number>()
  for (const pad of footprintCircuitJson) {
    if (pad.type !== "pcb_smtpad" && pad.type !== "pcb_plated_hole") continue
    const hints = pad.port_hints ?? []
    const physicalMatches = new Set(
      hints.flatMap((hint) => {
        const owner = physicalOwners.get(physicalId(hint))
        return owner === undefined ? [] : [owner]
      }),
    )
    const matches = physicalMatches.size
      ? [...physicalMatches]
      : pins.flatMap((pin, index) =>
          hints.some((hint) => pin.name.includes(hint)) ? [index] : [],
        )
    if (matches.length !== 1) {
      return invalid(
        `copper pad ${hints.join("/") || "without pin hints"} maps to ${matches.length} physical pins`,
      )
    }
    const owner = matches[0]!
    padOwners.set(pad, owner)
    mappedPins.add(owner)
    const ordinals = ordinalHints.get(owner) ?? new Set<number>()
    for (const hint of hints) {
      const match = hint.match(/^(?:pin)?(\d+)$/i)
      if (match) ordinals.add(Number(match[1]))
    }
    ordinalHints.set(owner, ordinals)
  }
  if (mappedPins.size !== pins.length) {
    const missing = pins
      .filter((_, index) => !mappedPins.has(index))
      .map((pin) => pin.pin_number)
    return invalid(`physical pins have no footprint pad: ${missing.join(", ")}`)
  }

  const corePinKeys = new Map<number, string>()
  const ordinalOwners = new Map<number, number>()
  pins.forEach((pin, index) => {
    const ordinals = ordinalHints.get(index)!
    const numeric = /^\d+$/.test(pin.pin_number)
    if (ordinals.size > 1)
      return invalid(`conflicting footprint ordinals for ${pin.pin_number}`)
    const ordinal = numeric ? Number(pin.pin_number) : [...ordinals][0]
    if (ordinal === undefined) return
    if (numeric && ordinals.size && !ordinals.has(ordinal)) {
      return invalid(
        `footprint changes physical pin ${pin.pin_number} to another ordinal`,
      )
    }
    if (
      !Number.isSafeInteger(ordinal) ||
      ordinal < 0 ||
      ordinalOwners.has(ordinal)
    ) {
      return invalid(`conflicting core pin ordinal ${ordinal}`)
    }
    ordinalOwners.set(ordinal, index)
    corePinKeys.set(index, `pin${ordinal}`)
  })
  let nextOrdinal = Math.max(0, ...ordinalOwners.keys()) + 1
  pins.forEach((_, index) => {
    if (!corePinKeys.has(index)) corePinKeys.set(index, `pin${nextOrdinal++}`)
  })

  const names = pins.flatMap((pin) => [
    pin.pin_number,
    physicalId(pin.pin_number),
    ...pin.name,
  ])
  const selectors = makeSelectors(names)
  const pinLabels: Record<string, string[]> = {}
  pins.forEach((pin, index) => {
    const key = corePinKeys.get(index)!
    const aliases = [
      ...new Set([
        ...(/^\d+$/.test(pin.pin_number)
          ? []
          : [pin.pin_number, physicalId(pin.pin_number)]),
        ...pin.name,
      ]),
    ]
    if (!aliases.length) aliases.push(pin.pin_number)
    for (const alias of aliases) {
      const physicalOwner = physicalOwners.get(physicalId(alias))
      if (physicalOwner !== undefined && physicalOwner !== index) {
        return invalid(`${key} aliases another physical pin ${alias}`)
      }
      const match = alias.match(/^(?:pin)?(\d+)$/i)
      if (match && `pin${Number(match[1])}` !== key) {
        return invalid(`${key} cannot alias physical pin${Number(match[1])}`)
      }
    }
    pinLabels[key] = aliases.map((alias) => selectors.get(alias)!)
  })

  const pinAttributes: Record<string, PinAttributeMap> = {}
  const mergeAttributes = (
    index: number,
    attributes: PinAttributeMap,
    physical: boolean,
  ) => {
    const key = corePinKeys.get(index)!
    const previous = pinAttributes[key] ?? {}
    for (const [attribute, value] of Object.entries(attributes)) {
      const before = (previous as Record<string, unknown>)[attribute]
      if (
        !physical &&
        before !== undefined &&
        JSON.stringify(before) !== JSON.stringify(value)
      ) {
        return invalid(
          `conflicting ${attribute} attributes for ${pins[index]!.pin_number}`,
        )
      }
    }
    pinAttributes[key] = { ...previous, ...attributes }
  }
  const physicalAttributes = new Map<number, PinAttributeMap>()
  for (const [label, attributes] of Object.entries(
    datasheet.pin_attributes ?? {},
  )) {
    const owner = physicalOwners.get(physicalId(label))
    if (owner !== undefined) {
      const previous = physicalAttributes.get(owner) ?? {}
      for (const [attribute, value] of Object.entries(attributes)) {
        const before = (previous as Record<string, unknown>)[attribute]
        if (
          before !== undefined &&
          JSON.stringify(before) !== JSON.stringify(value)
        ) {
          return invalid(
            `conflicting physical ${attribute} attributes for ${pins[owner]!.pin_number}`,
          )
        }
      }
      physicalAttributes.set(owner, { ...previous, ...attributes })
      continue
    }
    const owners = pins.flatMap((pin, index) =>
      pin.name.includes(label) ? [index] : [],
    )
    if (!owners.length)
      return invalid(`pin_attributes refers to unknown pin ${label}`)
    for (const index of owners) mergeAttributes(index, attributes, false)
  }
  for (const [index, attributes] of physicalAttributes)
    mergeAttributes(index, attributes, true)

  const mappedFootprint = footprintCircuitJson.map((element) => {
    const owner = padOwners.get(element)
    if (
      owner === undefined ||
      (element.type !== "pcb_smtpad" && element.type !== "pcb_plated_hole")
    ) {
      return element
    }
    const key = corePinKeys.get(owner)!
    return {
      ...element,
      port_hints: [
        ...new Set([...(element.port_hints ?? []), key, ...pinLabels[key]!]),
      ],
    }
  })
  const componentName = componentNameFor(datasheet.chip_name)
  const tsx = `import type { ChipProps } from "@tscircuit/props"\n\nconst pinLabels = ${JSON.stringify(pinLabels, null, 2)} as const\n\nexport const ${componentName} = (props: ChipProps<typeof pinLabels>) => (\n  <chip\n    pinLabels={pinLabels}\n    pinAttributes={${JSON.stringify(pinAttributes, null, 2)}}\n    manufacturerPartNumber={${JSON.stringify(datasheet.chip_name)}}\n    footprint={${JSON.stringify(datasheet.footprinter_string)}}\n    {...props}\n  />\n)\n\nexport default ${componentName}\n`
  return {
    datasheetId: datasheet.datasheet_id,
    chipName: datasheet.chip_name,
    componentName,
    ...(datasheet.ai_description
      ? { description: datasheet.ai_description }
      : {}),
    tsx,
    footprintCircuitJson: mappedFootprint,
    footprint: datasheet.footprinter_string,
    pinLabels,
    pinAttributes,
  }
}
