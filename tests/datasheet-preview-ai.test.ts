import { expect, test } from "bun:test"
import {
  OPENAI_DATASHEET_MODEL_ID,
  createDatasheetPreviewAi,
  datasheetPreviewProviders,
} from "../examples/assets/create-datasheet-preview-ai"
import { generateDatasheetAssets } from "../lib/ai/generate-datasheet-assets"
import { generatedAssets, providerAssets } from "./fixtures/datasheet-ai"

const selectedModelId = "user-selected-model"
const pdfBytes = "%PDF-1.7\nUser-supplied datasheet"
const outputText = JSON.stringify(providerAssets())

// OpenAI accepts a subset of JSON Schema, even when the schema is valid for Zod.
const expectSupportedOpenAiSchema = (schema: any) => {
  for (const keyword of [
    "allOf",
    "not",
    "dependentRequired",
    "dependentSchemas",
    "if",
    "then",
    "else",
  ]) {
    expect(schema).not.toHaveProperty(keyword)
  }
  if (schema.type === "object") {
    expect(schema.additionalProperties).toBe(false)
    expect([...schema.required].sort()).toEqual(
      Object.keys(schema.properties).sort(),
    )
  }
  for (const property of Object.values(schema.properties ?? {})) {
    expectSupportedOpenAiSchema(property)
  }
  for (const alternative of schema.anyOf ?? []) {
    expectSupportedOpenAiSchema(alternative)
  }
  if (schema.items) expectSupportedOpenAiSchema(schema.items)
}

const otherProviderCases = [
  {
    provider: "openai" as const,
    path: "/responses",
    response: {
      id: "resp_test",
      object: "response",
      created_at: 0,
      model: selectedModelId,
      status: "completed",
      output: [
        {
          id: "msg_test",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: outputText, annotations: [] }],
        },
      ],
      usage: { input_tokens: 100, output_tokens: 100, total_tokens: 200 },
    },
    getPdfData: (body: any) =>
      body.input
        .find((message: any) => message.role === "user")
        .content.find((part: any) => part.type === "input_file")
        .file_data.split(",")[1],
  },
  {
    provider: "google" as const,
    path: `/models/${selectedModelId}:generateContent`,
    response: {
      candidates: [
        {
          content: { role: "model", parts: [{ text: outputText }] },
          finishReason: "STOP",
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 100,
        totalTokenCount: 200,
      },
    },
    getPdfData: (body: any) =>
      body.contents[0].parts.find((part: any) => part.inlineData).inlineData
        .data,
  },
  {
    provider: "openai-compatible" as const,
    path: "/chat/completions",
    response: {
      id: "chat_test",
      object: "chat.completion",
      created: 0,
      model: selectedModelId,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: outputText },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 },
    },
    getPdfData: (body: any) =>
      body.messages
        .find((message: any) => message.role === "user")
        .content.find((part: any) => part.type === "file")
        .file.file_data.split(",")[1],
  },
]

for (const { provider, path, response, getPdfData } of otherProviderCases) {
  test(`${provider} uses the user's endpoint, model and PDF`, async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const ai = createDatasheetPreviewAi(
      { provider, proxyUrl: "/chosen-backend/v1", modelId: selectedModelId },
      {
        origin: "https://preview.example.test",
        fetch: (async (input, init) => {
          calls.push({ url: String(input), init: init! })
          return new Response(JSON.stringify(response), {
            headers: { "content-type": "application/json" },
          })
        }) as typeof fetch,
      },
    )
    expect(calls).toHaveLength(0)
    const result = await generateDatasheetAssets({
      ai,
      file: new File([pdfBytes], "user.pdf", { type: "application/pdf" }),
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(
      `https://preview.example.test/chosen-backend/v1${path}`,
    )
    const body = JSON.parse(String(calls[0].init.body))
    if (provider !== "google") expect(body.model).toBe(selectedModelId)
    expect(Buffer.from(getPdfData(body), "base64").toString()).toBe(pdfBytes)
    expect(result).toEqual(generatedAssets)
  })
}

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
      provider: "anthropic",
      proxyUrl: "/api/anthropic/v1",
      modelId: "claude-sonnet-4-5",
      sessionToken: "host-session-for-test",
      apiKey: "provider-key-must-not-reach-custom-server",
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
            content: [
              { type: "text", text: JSON.stringify(providerAssets(returned)) },
            ],
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
  expect(JSON.stringify(calls[0].init)).not.toContain(
    "provider-key-must-not-reach-custom-server",
  )
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

test("OpenAI uses GPT-6 Astra without asking for a model ID", async () => {
  const calls: { url: string; init: RequestInit }[] = []
  const ai = createDatasheetPreviewAi(
    { provider: "openai", apiKey: "personal-preview-test-key" },
    {
      origin: "https://preview.example.test",
      fetch: (async (input, init) => {
        calls.push({ url: String(input), init: init! })
        return new Response(JSON.stringify(otherProviderCases[0].response), {
          headers: { "content-type": "application/json" },
        })
      }) as typeof fetch,
    },
  )
  expect(calls).toHaveLength(0)
  const result = await generateDatasheetAssets({
    ai,
    file: new File([pdfBytes], "user.pdf", { type: "application/pdf" }),
  })
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe("https://api.openai.com/v1/responses")
  const body = JSON.parse(String(calls[0].init.body))
  expect(body.model).toBe(OPENAI_DATASHEET_MODEL_ID)
  expect(body.model).toBe("gpt-6-astra")
  expect(body.text.format.type).toBe("json_schema")
  expect(body.text.format.strict).toBe(true)
  expectSupportedOpenAiSchema(body.text.format.schema)
  expect(result).toEqual(generatedAssets)
})

for (const provider of ["openai", "anthropic", "google"] as const) {
  test(`${provider} connects to its automatic address and never substitutes output on auth failure`, async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const ai = createDatasheetPreviewAi(
      {
        provider,
        modelId: selectedModelId,
        apiKey: "personal-preview-test-key",
      },
      {
        origin: "https://preview.example.test",
        fetch: (async (input, init) => {
          calls.push({ url: String(input), init: init! })
          return new Response(
            JSON.stringify({
              error: { message: "Provider rejected credentials" },
            }),
            { status: 401, headers: { "content-type": "application/json" } },
          )
        }) as typeof fetch,
      },
    )
    expect(calls).toHaveLength(0)
    await expect(
      generateDatasheetAssets({
        ai,
        file: new File([pdfBytes], "user.pdf", { type: "application/pdf" }),
      }),
    ).rejects.toThrow()
    expect(calls).toHaveLength(1)
    expect(new URL(calls[0].url).origin).toBe(
      new URL(datasheetPreviewProviders[provider].baseUrl).origin,
    )
    expect(calls[0].init.credentials).toBe("omit")
    const headers = new Headers(calls[0].init.headers)
    const credentialHeader = {
      openai: "authorization",
      anthropic: "x-api-key",
      google: "x-goog-api-key",
    }[provider]
    expect(headers.get(credentialHeader)).toContain("personal-preview-test-key")
    expect(calls[0].url).not.toContain("personal-preview-test-key")
  })
}

test("missing or invalid preview connections never fall back to sample generation", () => {
  expect(() =>
    createDatasheetPreviewAi(
      { provider: "" as any, proxyUrl: "/api/v1", modelId: selectedModelId },
      { origin: "https://preview.example.test" },
    ),
  ).toThrow("Choose an AI provider")
  for (const proxyUrl of [
    "",
    "https://api.anthropic.com/v1",
    "https://user:password@proxy.example.test/v1",
    "http://proxy.example.test/v1",
  ]) {
    expect(() =>
      createDatasheetPreviewAi(
        { provider: "anthropic", proxyUrl, modelId: "model" },
        { origin: "https://preview.example.test" },
      ),
    ).toThrow()
  }
  expect(() =>
    createDatasheetPreviewAi(
      { provider: "anthropic", proxyUrl: "/api/anthropic/v1", modelId: "" },
      { origin: "https://preview.example.test" },
    ),
  ).toThrow()
})
