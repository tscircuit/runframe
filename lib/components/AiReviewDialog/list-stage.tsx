import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { registryKy, hasRegistryToken } from "lib/utils/get-registry-ky"
import { toast } from "lib/utils/toast"
import type { CircuitJson } from "circuit-json"
import type { AiReview } from "./types"

export const AiReviewListStage = ({
  packageName,
  onSelectReview,
}: {
  packageName: string | null
  onSelectReview: (review: AiReview) => void
}) => {
  const fsMap = useRunFrameStore((s) => s.fsMap)
  const circuitJson = useRunFrameStore((s) => s.circuitJson)
  const [reviews, setReviews] = useState<AiReview[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!packageName || !hasRegistryToken()) return
    setLoading(true)
    registryKy
      .get("ai_reviews/list", { searchParams: { package_name: packageName } })
      .json<{ ai_reviews: AiReview[] }>()
      .then((data) => setReviews(data.ai_reviews))
      .catch((err) => {
        console.error("Failed to load AI reviews", err)
        toast.error("Failed to load AI reviews")
      })
      .finally(() => setLoading(false))
  }, [packageName])

  const requestReview = async () => {
    if (!circuitJson) {
      toast.error("Need Circuit JSON to Request AI Review")
      return
    }
    if (!packageName) {
      toast.error("Package name unknown")
      return
    }
    if (!hasRegistryToken()) {
      toast.error("Missing registry token")
      return
    }
    setCreating(true)
    try {
      const { ai_review } = await registryKy
        .post("ai_reviews/create", {
          json: {
            package_name: packageName,
            fs_map: Object.fromEntries(fsMap),
            circuit_json: circuitJson as CircuitJson,
          },
        })
        .json<{ ai_review: AiReview }>()
      setReviews((r) => [ai_review, ...r])
      onSelectReview(ai_review)
      toast.success("AI review requested")
    } catch (err) {
      console.error("Failed to create AI review", err)
      toast.error("Failed to request AI review")
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>AI Review</DialogTitle>
        <DialogDescription>
          Select an AI review or request a new one.
        </DialogDescription>
      </DialogHeader>
      <div className="rf-flex rf-gap-4 rf-mt-4">
        <div className="rf-w-48 rf-h-64 rf-overflow-y-auto rf-border rf-rounded rf-p-2 rf-flex-shrink-0">
          {loading ? (
            <div className="rf-text-sm">Loading...</div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div
                key={review.ai_review_id}
                className="rf-text-sm rf-p-2 rf-cursor-pointer rf-rounded hover:rf-bg-zinc-100"
                onClick={() => onSelectReview(review)}
              >
                {new Date(review.created_at || "").toLocaleString()}
              </div>
            ))
          ) : (
            <div className="rf-text-sm rf-text-muted-foreground">
              No AI reviews found.
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="rf-mt-4">
        <Button onClick={requestReview} disabled={creating}>
          {creating ? "Requesting..." : "Review my Board"}
        </Button>
      </DialogFooter>
    </>
  )
}
