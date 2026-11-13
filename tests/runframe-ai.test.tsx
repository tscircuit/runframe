import { expect, mock, test } from "bun:test"
import { MockLanguageModelV4 } from "ai/test"
import { renderToString } from "react-dom/server"
import {
  RunFrameAiProvider,
  useRunFrameAi,
  type RunFrameAiConfig,
} from "../lib/ai"

test("AI configuration stays local to each provider and never invokes a model", () => {
  const generate = mock(() => {
    throw new Error("AI must not run when configuration is supplied")
  })
  const first = { model: new MockLanguageModelV4({ doGenerate: generate }) }
  const second = { model: new MockLanguageModelV4({ doGenerate: generate }) }
  const observed: (RunFrameAiConfig | undefined)[] = []
  const Probe = () => {
    observed.push(useRunFrameAi())
    return null
  }
  renderToString(
    <>
      <Probe />
      <RunFrameAiProvider ai={first}>
        <Probe />
        <RunFrameAiProvider ai={second}>
          <Probe />
        </RunFrameAiProvider>
        <Probe />
        <RunFrameAiProvider>
          <Probe />
        </RunFrameAiProvider>
      </RunFrameAiProvider>
      <Probe />
    </>,
  )
  expect(observed).toEqual([
    undefined,
    first,
    second,
    first,
    undefined,
    undefined,
  ])
  expect(generate).not.toHaveBeenCalled()
})
