import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { registryKy } from "lib/utils/get-registry-ky"
import { toast } from "lib/utils/toast"
import type { CircuitJson } from "circuit-json"

interface AiReview {
  ai_review_id: string
  ai_review_text: string | null
  start_processing_at: string | null
  finished_processing_at: string | null
  processing_error: any
  created_at: string
  display_status: "pending" | "completed" | "failed"
}

export interface AiReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  packageName: string
  fsMap: Map<string, string>
  circuitJson?: CircuitJson | null
}

export const AiReviewDialog = ({
  isOpen,
  onClose,
  packageName,
  fsMap,
  circuitJson,
}: AiReviewDialogProps) => {
  const [aiReviews, setAiReviews] = useState<AiReview[]>([])
  const [selected, setSelected] = useState<AiReview | null>(null)
  const [loading, setLoading] = useState(false)

  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await registryKy
        .get("ai_reviews/list", { searchParams: { package_name: packageName } })
        .json<{ ai_reviews: AiReview[] }>()
      setAiReviews(res.ai_reviews)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load AI reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadReviews()
    }
  }, [isOpen])

  const requestReview = async () => {
    if (!circuitJson) {
      toast.error("Need Circuit JSON to Request AI Review")
      return
    }
    try {
      await registryKy.post("ai_reviews/create", {
        json: {
          package_name: packageName,
          fs_map: Object.fromEntries(fsMap.entries()),
          circuit_json: circuitJson,
        },
      })
      toast.success("AI review requested")
      await loadReviews()
    } catch (err) {
      console.error(err)
      toast.error("Failed to request AI review")
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="!rf-max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Review</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="rf-text-sm">Loading...</p>
        ) : (
          <div className="rf-flex rf-h-64 rf-gap-4">
            <div className="rf-w-40 rf-border-r rf-overflow-y-auto">
              {aiReviews.map((r) => (
                <button
                  key={r.ai_review_id}
                  className={`rf-w-full rf-p-2 rf-text-left rf-text-xs hover:rf-bg-zinc-100 ${
                    selected?.ai_review_id === r.ai_review_id
                      ? "rf-bg-zinc-100"
                      : ""
                  }`}
                  onClick={() => setSelected(r)}
                >
                  <div>{new Date(r.created_at).toLocaleString()}</div>
                  <div className="rf-text-[10px]">{r.display_status}</div>
                </button>
              ))}
            </div>
            <div className="rf-flex-1 rf-overflow-y-auto rf-text-sm rf-p-2">
              {selected ? (
                selected.ai_review_text ? (
                  <pre className="rf-whitespace-pre-wrap">
                    {selected.ai_review_text}
                  </pre>
                ) : (
                  <p>Review pending...</p>
                )
              ) : (
                <p>Select a review to view its results.</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={requestReview}>Review my Board</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
