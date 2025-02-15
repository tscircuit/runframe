import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { ClipboardIcon } from "lucide-react"
import { Button } from "lib/components/ui/button"

export const ErrorTabContent = ({
  code,
  isStreaming,
  errorMessage,
}: {
  code?: string
  isStreaming?: boolean
  errorMessage?: string | null
}) => {
  if (!errorMessage) {
    return (
      <div className="rf-mt-4 rf-bg-green-50 rf-rounded-md rf-border rf-border-green-200">
        <div className="rf-p-4">
          <h3 className="rf-text-lg rf-font-semibold rf-text-green-800 rf-mb-3">
            No Errors 👌
          </h3>
          <p className="rf-text-sm rf-text-green-700">
            Your code is running without any errors.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200 rf-max-h-[500px] rf-overflow-y-auto">
        <div className="rf-p-4">
          <h3 className="rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3">
            Error
          </h3>
          <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-2">
            {errorMessage}
          </p>
        </div>
      </div>
      <div className="rf-flex rf-gap-2 rf-mt-4 rf-justify-end">
        <Button
          variant="outline"
          onClick={() => {
            if (!errorMessage) return
            navigator.clipboard.writeText(errorMessage)
            alert("Error copied to clipboard!")
          }}
        >
          <ClipboardIcon className="rf-w-4 rf-h-4" />
          Copy Error
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.alert(
              "Not supported yet! Please report/upvote an issue on github.com/tscircuit/tscircuit",
            )
            // const title = `Error: ${errorMessage
            //   .replace("Render Error:", "")
            //   .replace(/\"_errors\":\[\]/g, "")
            //   .replace(/\{,/g, "{")
            //   .replace(/"_errors":\[/g, "")
            //   .replace(/[^a-zA-Z0-9 ]/g, " ")
            //   .replace(/\s+/g, " ")
            //   .replace(/ \d+ /g, " ")
            //   .slice(0, 100)}`
            // const url = encodeTextToUrlHash(code ?? "").replace(
            //   "http://localhost:5173",
            //   "https://snippets.tscircuit.com",
            // )
            // let body = `[Snippet code to reproduce](${url})\n\n### Error\n\`\`\`\n${errorMessage.slice(0, 600)}\n\`\`\``
            // if (body.length > 4000) {
            //   body = `\`\`\`tsx\n// Please paste the code here\`\`\`\n\n### Error\n\`\`\`\n${errorMessage.slice(0, 2000)}\n\`\`\``
            // }
            // window.open(
            //   `https://github.com/tscircuit/snippets/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
            //   "_blank",
            // )
          }}
        >
          <GitHubLogoIcon className="rf-w-4 rf-h-4" />
          Report Issue
        </Button>
      </div>
    </>
  )
}
