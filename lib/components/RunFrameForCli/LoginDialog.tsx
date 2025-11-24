import { useCallback, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { toast } from "lib/utils/toast"
import { getRegistryKy } from "lib/utils/get-registry-ky"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: () => void
  onOpen?: () => void
}

type LoginState =
  | "idle"
  | "creating"
  | "waiting"
  | "exchanging"
  | "success"
  | "error"

export const LoginDialog = ({
  isOpen,
  onClose,
  onLoginSuccess,
}: LoginDialogProps) => {
  const [loginState, setLoginState] = useState<LoginState>("idle")
  const [loginUrl, setLoginUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pushEvent = useRunFrameStore((state) => state.pushEvent)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSignIn = useCallback(async () => {
    setLoginState("creating")
    setErrorMessage(null)
    abortControllerRef.current = new AbortController()

    try {
      const ky = getRegistryKy()

      const { login_page } = await ky
        .post("sessions/login_page/create", {
          json: {},
        })
        .json<{
          login_page: {
            login_page_id: string
            login_page_auth_token: string
            url: string
          }
        }>()

      setLoginUrl(login_page.url)
      setLoginState("waiting")

      const urlWithAutoclose = new URL(login_page.url)
      urlWithAutoclose.searchParams.set("autoclose", "true")
      window.open(urlWithAutoclose.toString(), "_blank")

      while (!abortControllerRef.current?.signal.aborted) {
        const { login_page: updatedLoginPage } = await ky
          .post("sessions/login_page/get", {
            json: {
              login_page_id: login_page.login_page_id,
            },
            headers: {
              Authorization: `Bearer ${login_page.login_page_auth_token}`,
            },
          })
          .json<{
            login_page: { was_login_successful: boolean; is_expired: boolean }
          }>()

        if (updatedLoginPage.was_login_successful) {
          setLoginState("exchanging")
          break
        }

        if (updatedLoginPage.is_expired) {
          throw new Error("Login page expired. Please try again.")
        }

        await delay(1000)
      }

      if (abortControllerRef.current?.signal.aborted) {
        setLoginState("idle")
        return
      }

      const { session } = await ky
        .post("sessions/login_page/exchange_for_cli_session", {
          json: {
            login_page_id: login_page.login_page_id,
          },
          headers: {
            Authorization: `Bearer ${login_page.login_page_auth_token}`,
          },
        })
        .json<{ session: { token: string } }>()

      if (typeof window !== "undefined") {
        window.TSCIRCUIT_REGISTRY_TOKEN = session.token
      }

      await pushEvent({
        event_type: "TOKEN_UPDATED",
        registry_token: session.token,
      })

      setLoginState("success")
      toast.success("Successfully logged in!")
      onLoginSuccess?.()

      setTimeout(() => {
        onClose()
        setLoginState("idle")
        setLoginUrl(null)
      }, 1000)
    } catch (error) {
      console.error("Login error:", error)
      const message =
        error instanceof Error ? error.message : "Failed to complete login"
      setErrorMessage(message)
      setLoginState("error")
      toast.error(message)
    }
  }, [pushEvent, onLoginSuccess, onClose])

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setLoginState("idle")
    setLoginUrl(null)
    setErrorMessage(null)
    onClose()
  }, [onClose])

  const isLoading =
    loginState === "creating" ||
    loginState === "waiting" ||
    loginState === "exchanging"

  const getStatusMessage = () => {
    switch (loginState) {
      case "creating":
        return "Creating login page..."
      case "waiting":
        return "Waiting for you to complete login in the browser..."
      case "exchanging":
        return "Generating token..."
      case "success":
        return "Successfully logged in!"
      case "error":
        return errorMessage || "An error occurred"
      default:
        return null
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && handleCancel()}
    >
      <DialogContent className="rf-max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In Required</DialogTitle>
          <DialogDescription>
            {loginState === "idle" || loginState === "error"
              ? "Sign in to continue. A new browser window will open for authentication."
              : "Complete the login process in the opened browser window."}
          </DialogDescription>
        </DialogHeader>
        <div className="rf-flex rf-flex-col rf-items-center rf-gap-4 rf-py-4">
          {loginState === "idle" || loginState === "error" ? (
            <Button onClick={handleSignIn} className="rf-w-full">
              Sign In
            </Button>
          ) : (
            <div className="rf-flex rf-flex-col rf-items-center rf-gap-3 rf-w-full">
              {loginState !== "success" && (
                <div className="rf-animate-spin rf-w-6 rf-h-6 rf-border-2 rf-border-gray-300 rf-border-t-blue-600 rf-rounded-full" />
              )}
              <p className="rf-text-sm rf-text-gray-600 rf-text-center">
                {getStatusMessage()}
              </p>
              {loginUrl && loginState === "waiting" && (
                <a
                  href={loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rf-text-xs rf-text-blue-600 hover:rf-underline"
                >
                  Click here if the window didn't open
                </a>
              )}
            </div>
          )}
          {errorMessage && loginState === "error" && (
            <p className="rf-text-sm rf-text-red-600 rf-text-center">
              {errorMessage}
            </p>
          )}
          {isLoading && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rf-w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const useLoginDialog = () => {
  const [isOpen, setIsOpen] = useState(false)

  const openLoginDialog = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeLoginDialog = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleLoginSuccess = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    LoginDialog: (
      <LoginDialog
        isOpen={isOpen}
        onClose={closeLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
    ),
    openLoginDialog,
  }
}
