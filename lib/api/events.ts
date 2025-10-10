type FileEvent = {
  type: "upload" | "delete" | "rename"
  path: string
  prevPath?: string
  timestamp?: string
  metadata?: Record<string, any>
}

async function postEvent(event: FileEvent): Promise<Response> {
  const body = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  }

  try {
    const res = await fetch(`/api/events/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error("Failed to post file event", { status: res.status, body })
    }
    return res
  } catch (err) {
    console.warn("Event post failed, retrying once", err)
    try {
      const res2 = await fetch(`/api/events/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res2.ok) {
        console.error("Failed to post file event on retry", res2.status)
      }
      return res2
    } catch (err2) {
      console.error("Retry failed for event post", err2)
      throw err2
    }
  }
}

export const eventsApi = {
  postUpload: (path: string, metadata?: Record<string, any>) =>
    postEvent({ type: "upload", path, metadata }),
  postDelete: (path: string) => postEvent({ type: "delete", path }),
  postRename: (prevPath: string, path: string) =>
    postEvent({ type: "rename", path, prevPath }),
}

export default eventsApi
