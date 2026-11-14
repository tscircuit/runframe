import { useEffect, useRef, useState } from "react"
import { useRunFrameAi, type RunFrameAi } from "../../ai/RunFrameAiProvider"
import {
  buildRunFramePrompt,
  runFramePromptOptions,
  type RunFramePromptOption,
  type RunFramePromptTask,
} from "../../ai/build-runframe-prompt"
import { useStyles } from "../../hooks/use-styles"
import { openForDownload } from "../../optional-features/exporting/open-for-download"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"

export interface PromptGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ai?: RunFrameAi
}

export const PromptGeneratorDialog = ({
  open,
  onOpenChange,
  ai: aiProp,
}: PromptGeneratorDialogProps) => {
  useStyles()
  const contextAi = useRunFrameAi()
  const ai = aiProp ?? contextAi
  const [task, setTask] = useState<RunFramePromptTask>("component")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<RunFramePromptOption[]>([
    "footprint",
    "symbol",
  ])
  const [attachments, setAttachments] = useState<File[]>([])
  const [edited, setEdited] = useState<{
    text: string
    template: string
  } | null>(null)
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)
  const pending = useRef<AbortController | null>(null)
  const template = buildRunFramePrompt({
    task,
    description,
    options,
    attachmentNames: attachments.map((file) => file.name),
  })
  const prompt = edited?.text ?? template
  const optionsChanged = edited !== null && edited.template !== template

  // Abort on close, adapter replacement or unmount, even for a host that
  // ignores AbortSignal. The identity check below also rejects late responses.
  useEffect(() => {
    setBusy(false)
    return () => {
      pending.current?.abort()
      pending.current = null
    }
  }, [open, ai])

  const cancel = () => {
    pending.current?.abort()
    pending.current = null
    setBusy(false)
    setStatus("Request cancelled.")
  }

  const send = async () => {
    if (!ai || pending.current || !prompt.trim()) return
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    setError("")
    setStatus("")
    setResponse("")
    try {
      const result = await ai.generate({
        prompt,
        attachments: [...attachments],
        signal: controller.signal,
      })
      if (pending.current !== controller || controller.signal.aborted) return
      if (typeof result !== "string" || !result.trim()) {
        throw new Error("The AI returned an empty response. Try again.")
      }
      setResponse(result)
    } catch (failure) {
      if (pending.current !== controller || controller.signal.aborted) return
      setError(
        failure instanceof Error ? failure.message : "AI request failed.",
      )
    } finally {
      if (pending.current === controller) {
        pending.current = null
        setBusy(false)
      }
    }
  }

  const attach = (file?: File) => {
    if (!file) return
    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      file.size === 0 ||
      file.size > 20 * 1024 * 1024
    ) {
      setError("Choose a non-empty PDF up to 20 MB.")
      return
    }
    setAttachments([file])
    setError("")
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setStatus("Prompt copied.")
      setError("")
    } catch {
      setError("Could not copy. Select the prompt text or download it instead.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!rf-max-w-4xl rf-w-[calc(100vw-2rem)] rf-max-h-[90dvh] rf-overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prompt generator</DialogTitle>
          <DialogDescription>
            Choose what to build, review the prompt, then copy it to your agent
            or send it to your connected AI.
          </DialogDescription>
        </DialogHeader>
        <div className="rf-grid rf-gap-5 md:rf-grid-cols-2">
          <fieldset
            disabled={busy}
            className="rf-grid rf-content-start rf-gap-4 rf-min-w-0"
          >
            <label className="rf-grid rf-gap-1 rf-text-sm">
              Task
              <select
                className="rf-rounded rf-border rf-bg-white rf-p-2"
                value={task}
                onChange={(event) => {
                  const next = event.target.value as RunFramePromptTask
                  setTask(next)
                  setOptions(
                    next === "component"
                      ? ["footprint", "symbol"]
                      : next === "simulation"
                        ? ["spice", "simulation"]
                        : [],
                  )
                }}
              >
                <option value="component">Import a component</option>
                <option value="simulation">Create a simulation</option>
                <option value="custom">Custom task</option>
              </select>
            </label>
            <label className="rf-grid rf-gap-1 rf-text-sm">
              Component or task details
              <textarea
                className="rf-rounded rf-border rf-p-2 rf-min-h-24"
                value={description}
                placeholder="e.g. LM358 in SOIC-8, test as a voltage follower at 5 V"
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="rf-grid rf-gap-2">
              {runFramePromptOptions.map(({ id, label }) => (
                <label
                  key={id}
                  className="rf-flex rf-items-center rf-gap-2 rf-text-sm"
                >
                  <input
                    type="checkbox"
                    checked={options.includes(id)}
                    onChange={(event) =>
                      setOptions((current) =>
                        event.target.checked
                          ? [...current, id]
                          : current.filter((option) => option !== id),
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <div
              className="rf-rounded rf-border rf-border-dashed rf-p-3 rf-text-sm rf-grid rf-gap-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                if (!busy) attach(event.dataTransfer.files[0])
              }}
            >
              <label className="rf-grid rf-gap-2">
                Datasheet PDF (optional; drop here)
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => {
                    attach(event.target.files?.[0])
                    event.target.value = ""
                  }}
                />
              </label>
              {attachments.map((file) => (
                <div key={file.name} className="rf-break-all">
                  {file.name}{" "}
                  <button
                    type="button"
                    className="rf-underline"
                    onClick={() => setAttachments([])}
                  >
                    Remove PDF
                  </button>
                </div>
              ))}
            </div>
          </fieldset>
          <div className="rf-grid rf-content-start rf-gap-2 rf-min-w-0">
            <label className="rf-grid rf-gap-1 rf-text-sm">
              Prompt (editable)
              <textarea
                className="rf-rounded rf-border rf-p-3 rf-font-mono rf-text-xs rf-min-h-80 rf-w-full"
                value={prompt}
                disabled={busy}
                onChange={(event) =>
                  setEdited({
                    text: event.target.value,
                    template: edited?.template ?? template,
                  })
                }
              />
            </label>
            {optionsChanged && (
              <p className="rf-text-xs rf-text-amber-700">
                Options changed. Rebuild the prompt to include them; your edits
                are preserved until then.
              </p>
            )}
            {edited && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setEdited(null)}
              >
                Rebuild prompt from options
              </Button>
            )}
            <p className="rf-text-xs rf-text-zinc-500">
              {ai
                ? "Send to AI shares this prompt and the attached PDF with your host's AI connection."
                : "Copy or download this prompt to use it in ChatGPT, Codex, or another agent."}
              {attachments.length > 0 &&
                " When copying or downloading, attach the PDF separately in your agent."}
            </p>
          </div>
        </div>
        {error && (
          <p role="alert" className="rf-text-sm rf-text-red-600">
            {error}
          </p>
        )}
        <p role="status" className="rf-text-sm">
          {busy ? "Waiting for AI…" : status}
        </p>
        {response && (
          <div className="rf-grid rf-gap-2">
            <p className="rf-font-semibold">AI response</p>
            <p className="rf-text-xs rf-text-zinc-500">
              Review this response before using it. No files have been applied
              or simulations run by this dialog.
            </p>
            <pre className="rf-whitespace-pre-wrap rf-break-words rf-rounded rf-bg-zinc-100 rf-p-3 rf-text-xs">
              {response}
            </pre>
          </div>
        )}
        <DialogFooter className="rf-gap-2 rf-flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!prompt.trim()}
            onClick={copy}
          >
            Copy prompt
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!prompt.trim()}
            onClick={() =>
              openForDownload(prompt, { fileName: "tscircuit-prompt.txt" })
            }
          >
            Download prompt
          </Button>
          {ai &&
            (busy ? (
              <Button type="button" onClick={cancel}>
                Cancel request
              </Button>
            ) : (
              <Button type="button" disabled={!prompt.trim()} onClick={send}>
                Send to AI
              </Button>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Standalone control for hosts that draw their own Runframe header. */
export const PromptGeneratorButton = ({ ai }: { ai?: RunFrameAi }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Prompt generator
      </Button>
      <PromptGeneratorDialog open={open} onOpenChange={setOpen} ai={ai} />
    </>
  )
}
