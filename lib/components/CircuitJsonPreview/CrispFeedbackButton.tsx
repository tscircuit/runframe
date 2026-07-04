import { MessageCircleQuestion } from "lucide-react"
import { Button } from "../ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"

const CRISP_WEBSITE_ID = "24b58135-86c7-4e4b-bf6e-cca862bc4b26"
const CRISP_SCRIPT_ID = "runframe-crisp-chat-script"
const TSCIRCUIT_HOSTNAME = "tscircuit.com"

declare global {
  interface Window {
    $crisp?: any[]
    CRISP_WEBSITE_ID?: string
    __RUNFRAME_CRISP_CONFIGURED__?: boolean
  }
}

const pushCrispCommand = (command: any[]) => {
  window.$crisp = window.$crisp || []
  window.$crisp.push(command)
}

const configureCrisp = () => {
  window.$crisp = window.$crisp || []
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID

  if (!window.__RUNFRAME_CRISP_CONFIGURED__) {
    window.__RUNFRAME_CRISP_CONFIGURED__ = true
    pushCrispCommand(["do", "chat:hide"])
    pushCrispCommand([
      "on",
      "chat:closed",
      () => pushCrispCommand(["do", "chat:hide"]),
    ])
  }

  if (!document.getElementById(CRISP_SCRIPT_ID)) {
    const script = document.createElement("script")
    script.id = CRISP_SCRIPT_ID
    script.src = "https://client.crisp.chat/l.js"
    script.async = true
    document.head.appendChild(script)
  }
}

const openCrispChat = () => {
  configureCrisp()
  pushCrispCommand(["do", "chat:show"])
  pushCrispCommand(["do", "chat:open"])
}

export const shouldShowCrispFeedbackButton = ({
  isCli,
  hostname = typeof window !== "undefined"
    ? window.location.hostname
    : undefined,
}: {
  isCli?: boolean
  hostname?: string
} = {}) => {
  if (hostname?.toLowerCase() === TSCIRCUIT_HOSTNAME) return false
  if (isCli) return true
  return false
}

export const CrispFeedbackButton = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Get Support or Give Feedback"
            onClick={openCrispChat}
            className="rf-h-8 rf-w-8"
          >
            <MessageCircleQuestion className="rf-h-4 rf-w-4 rf-text-gray-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Get Support or Give Feedback
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
