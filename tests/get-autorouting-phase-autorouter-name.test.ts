import { describe, expect, test } from "bun:test"
import { getAutoroutingPhaseAutorouterName } from "../lib/autorouting"

describe("getAutoroutingPhaseAutorouterName", () => {
  test("identifies core strategies without mistaking a fanout's follow-up version for its router", () => {
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "custom",
        autorouterVersion: "beta_pipeline9",
      }),
    ).toBe("Custom")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "fanout",
        autorouterVersion: "beta_pipeline9",
        solverName: "FanoutSolver",
      }),
    ).toBe("Fanout")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "single_layer_fanout",
        solverName: "FanoutSolver",
      }),
    ).toBe("Single layer fanout")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "tscircuit_simplify",
        autorouterVersion: "beta_pipeline9",
        solverName: "AutoroutingPipelineSolver11_Simplification",
      }),
    ).toBe("Simplify")
  })

  test("displays the actual emitted pipeline instead of the generic tscircuit strategy or requested version", () => {
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "tscircuit",
        autorouterVersion: "beta_pipeline9",
        solverName: "AutoroutingPipelineSolver9_PreloadedTraceGraph",
      }),
    ).toBe("Pipeline9")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "tscircuit",
        autorouterVersion: "latest",
        solverName: "AutoroutingPipelineSolver7_MultiGraph",
      }),
    ).toBe("Pipeline7")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "tscircuit",
        autorouterVersion: "beta_pipeline9",
        solverName: "AssignableAutoroutingPipeline3",
      }),
    ).toBe("Assignable3")
    expect(
      getAutoroutingPhaseAutorouterName({
        solverName: "AutoroutingPipeline1_OriginalUnravel",
      }),
    ).toBe("Pipeline1")
  })

  test("uses the explicit version or strategy only when solver metadata is absent", () => {
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "tscircuit",
        autorouterVersion: "beta_pipeline9",
      }),
    ).toBe("Pipeline9")
    expect(
      getAutoroutingPhaseAutorouterName({ autorouterName: "tscircuit" }),
    ).toBe("default")
    expect(
      getAutoroutingPhaseAutorouterName({ autorouterName: "default" }),
    ).toBe("default")
    expect(
      getAutoroutingPhaseAutorouterName({ autorouterVersion: "latest" }),
    ).toBe("default")
  })

  test("does not mislabel legacy captures as the default router or discard unknown emitted identities", () => {
    expect(getAutoroutingPhaseAutorouterName({})).toBe("Unknown")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "  ",
        solverName: "",
      }),
    ).toBe("Unknown")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "vendor_router",
        solverName: "AutoroutingPipelineSolver9_PreloadedTraceGraph",
      }),
    ).toBe("vendor_router")
    expect(
      getAutoroutingPhaseAutorouterName({
        autorouterName: "tscircuit",
        solverName: "FutureRoutingSolver",
      }),
    ).toBe("FutureRoutingSolver")
    expect(
      getAutoroutingPhaseAutorouterName({ autorouterVersion: "preview-x" }),
    ).toBe("preview-x")
    expect(
      getAutoroutingPhaseAutorouterName({ autorouterName: "constructor" }),
    ).toBe("constructor")
  })
})
