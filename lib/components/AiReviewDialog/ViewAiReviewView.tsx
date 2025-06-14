import { useEffect, useMemo, useState } from "react"
import { Button } from "../ui/button"
import { DialogHeader, DialogTitle } from "../ui/dialog"
import { marked } from "marked"
import type { AiReview } from "./types"
import { getRegistryKy } from "lib/utils/get-registry-ky"

export const AiReviewViewView = ({
  review,
  onBack,
}: {
  review: AiReview
  onBack: () => void
}) => {
  // Get the latest ai review text, if it's not defined show
  // as loading

  const [aiReviewText, setAiReviewText] = useState<string | null>(
    review.ai_review_text ?? null,
  )

  const registryKy = getRegistryKy()

  const aiReviewId = review.ai_review_id
  useEffect(() => {
    if (!aiReviewId) return
    let timeout: any
    async function loadAiReviewText() {
      try {
        const response = await registryKy.get<{ ai_review: AiReview }>(
          "ai_reviews/get",
          {
            searchParams: { ai_review_id: aiReviewId },
          },
        )
        const { ai_review: newAiReview } = await response.json()

        if (newAiReview.ai_review_text) {
          setAiReviewText(newAiReview.ai_review_text)
          return
        }
      } catch (e) {
        console.error("Failed to load AI review text", e)
      }

      timeout = setTimeout(loadAiReviewText, 1000)
    }
    timeout = setTimeout(loadAiReviewText, 1000)
    return () => clearTimeout(timeout)
  }, [aiReviewId])

  const html = useMemo(
    () => marked.parse(review.ai_review_text || ""),
    [review.ai_review_text],
  )
  return (
    <>
      <DialogHeader className="rf-flex rf-flex-row rf-items-center rf-justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <DialogTitle>AI Review</DialogTitle>
      </DialogHeader>
      {aiReviewText ? (
        <div
          className="rf-h-64 rf-overflow-y-auto rf-prose rf-max-w-none rf-mt-2"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="rf-h-64 rf-overflow-y-auto rf-prose rf-max-w-none rf-mt-2">
          <div className="rf-flex rf-items-center rf-justify-center rf-h-full">
            <svg
              className="rf-animate-spin rf-h-6 rf-w-6 rf-text-zinc-400 rf-mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="rf-opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="rf-opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Loading...</span>
          </div>
        </div>
      )}
    </>
  )
}
