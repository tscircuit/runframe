import { expect, test } from "bun:test"
import { createDatasheetPreviewAi } from "../examples/assets/create-datasheet-preview-ai"
import { generateDatasheetAssets } from "../lib/ai/generate-datasheet-assets"
import { generatedAssets } from "./fixtures/datasheet-ai"

test("the preview sends the selected PDF to its configured real-provider transport", async () => {
  const returned = {
    ...generatedAssets,
    partNumber: "LM358",
    spiceModel: {
      filename: "lm358.cir",
      content:
        "* Test provider response, not a verified model\n.SUBCKT LM358 1 2 3 4 5 6 7 8\nE1 1 4 3 2 100000\nE2 7 4 5 6 100000\n.ENDS LM358",
      notes: "AI-generated behavioral macro-model; assumptions require review.",
      sourcePages: [3, 10],
    },
    warnings: ["Behavioral approximation; not manufacturer verified."],
  }
  const calls: { url: string; init: RequestInit }[] = []
  const ai = createDatasheetPreviewAi(
    {
      proxyUrl: "/api/anthropic/v1",
      modelId: "claude-sonnet-4-5",
      sessionToken: "host-session-for-test",
    },
    {
      origin: "https://preview.example.test",
      fetch: (async (input, init) => {
        calls.push({ url: String(input), init: init! })
        return new Response(
          JSON.stringify({
            id: "msg_test",
            type: "message",
            role: "assistant",
            model: "claude-sonnet-4-5",
            content: [{ type: "text", text: JSON.stringify(returned) }],
            stop_reason: "end_turn",
            stop_sequence: null,
            usage: { input_tokens: 100, output_tokens: 100 },
          }),
          { headers: { "content-type": "application/json" } },
        )
      }) as typeof fetch,
    },
  )
  expect(calls).toHaveLength(0)
  const document = "%PDF-1.7\nLM358 dual operational amplifier document bytes"
  const result = await generateDatasheetAssets({
    ai,
    file: new File([document], "lm358.pdf", { type: "application/pdf" }),
    targetPart: "LM358 SOIC-8 (D)",
  })
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe(
    "https://preview.example.test/api/anthropic/v1/messages",
  )
  expect(new Headers(calls[0].init.headers).get("authorization")).toBe(
    "Bearer host-session-for-test",
  )
  expect(calls[0].init.credentials).toBe("include")
  const body = JSON.parse(String(calls[0].init.body))
  const attachment = body.messages[0].content.find(
    (part: any) => part.type === "document",
  )
  expect(attachment.source.media_type).toBe("application/pdf")
  expect(Buffer.from(attachment.source.data, "base64").toString()).toBe(
    document,
  )
  expect(body.model).toBe("claude-sonnet-4-5")
  expect(JSON.stringify(body.messages)).toContain("LM358 SOIC-8 (D)")
  expect(result.partNumber).toBe("LM358")
  expect(result.spiceModel?.content).toBe(returned.spiceModel.content)
})

test("missing or invalid preview connections never fall back to sample generation", () => {
  for (const proxyUrl of [
    "",
    "https://api.anthropic.com/v1",
    "https://user:password@proxy.example.test/v1",
    "http://proxy.example.test/v1",
  ]) {
    expect(() =>
      createDatasheetPreviewAi(
        { proxyUrl, modelId: "model" },
        { origin: "https://preview.example.test" },
      ),
    ).toThrow()
  }
  expect(() =>
    createDatasheetPreviewAi(
      { proxyUrl: "/api/anthropic/v1", modelId: "" },
      { origin: "https://preview.example.test" },
    ),
  ).toThrow()
})
