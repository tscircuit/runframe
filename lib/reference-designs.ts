import { z } from "zod"

export const referenceDesignName = z.string().regex(/^[a-z][a-z0-9_]*$/)

export const referenceDesignFilePath = z
  .string()
  .min(1)
  .refine(
    (filePath) =>
      !filePath.startsWith("/") &&
      !filePath.includes("\\") &&
      !filePath.includes(":") &&
      filePath
        .split("/")
        .every((segment) => segment && segment !== "." && segment !== ".."),
    "Expected a relative package file path",
  )

const buildArtifactPath = referenceDesignFilePath.refine(
  (filePath) => filePath.startsWith("dist/"),
  "Reference design artifacts must be inside dist/",
)

export type ReferenceDesignJson =
  | string
  | number
  | boolean
  | null
  | ReferenceDesignJson[]
  | { [key: string]: ReferenceDesignJson }
const referenceDesignJsonSchema: z.ZodType<ReferenceDesignJson> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(referenceDesignJsonSchema),
    z.record(referenceDesignJsonSchema),
  ]),
)
export const referenceDesignPropsSchema = z.record(referenceDesignJsonSchema)

export type ReferenceDesignConfiguration = {
  name: string
  display_name: string
  props: Record<string, ReferenceDesignJson>
  circuit_json_path: string
  pcb_svg_path: string
  schematic_svg_path: string
  glb_path: string
  circuit_json_sha256: string
  glb_sha256: string
}

export type ReferenceDesign = {
  name: string
  display_name: string
  chip_names: string[]
  component_path: string
  props_schema: Record<string, ReferenceDesignJson>
  configurations: ReferenceDesignConfiguration[]
}

export type ReferenceDesignManifest = {
  schema_version: 1
  reference_designs: ReferenceDesign[]
}

export type PublishedReferenceDesign = {
  package_id: string
  package_release_id: string
  package_name: string
  reference_design: ReferenceDesign
  files: Array<{ file_path: string; package_file_id: string }>
}

export const referenceDesignConfigurationSchema: z.ZodType<ReferenceDesignConfiguration> =
  z.object({
    name: referenceDesignName,
    display_name: z.string().min(1),
    props: referenceDesignPropsSchema,
    circuit_json_path: buildArtifactPath,
    pcb_svg_path: buildArtifactPath,
    schematic_svg_path: buildArtifactPath,
    glb_path: buildArtifactPath,
    circuit_json_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    glb_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })

export const referenceDesignSchema: z.ZodType<ReferenceDesign> = z
  .object({
    name: referenceDesignName,
    display_name: z.string().min(1),
    chip_names: z.array(z.string().trim().min(1)).min(1),
    component_path: referenceDesignFilePath,
    props_schema: referenceDesignPropsSchema,
    configurations: z.array(referenceDesignConfigurationSchema).min(1),
  })
  .superRefine((design, ctx) => {
    const names = new Set<string>()
    for (const configuration of design.configurations) {
      if (names.has(configuration.name))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate configuration: ${configuration.name}`,
        })
      names.add(configuration.name)
    }
  })

export const referenceDesignManifestSchema: z.ZodType<ReferenceDesignManifest> =
  z
    .object({
      schema_version: z.literal(1),
      reference_designs: z.array(referenceDesignSchema),
    })
    .superRefine((manifest, ctx) => {
      const names = new Set<string>()
      for (const design of manifest.reference_designs) {
        if (names.has(design.name))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate reference design: ${design.name}`,
          })
        names.add(design.name)
      }
    })

export const REFERENCE_DESIGN_MANIFEST_PATH = "dist/reference-designs.json"

export const publishedReferenceDesignSchema: z.ZodType<PublishedReferenceDesign> =
  z.object({
    package_id: z.string().uuid(),
    package_release_id: z.string().uuid(),
    package_name: z.string(),
    reference_design: referenceDesignSchema,
    files: z.array(
      z.object({
        file_path: referenceDesignFilePath,
        package_file_id: z.string().uuid(),
      }),
    ),
  })
