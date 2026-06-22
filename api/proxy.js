const EASYEDA_HOSTNAME = "easyeda.com"

const getHeader = (headers, name) => {
  const value = headers[name]
  return Array.isArray(value) ? value[0] : value
}

const getRequestBody = (request) => {
  if (["GET", "HEAD"].includes(request.method ?? "GET")) return undefined
  if (typeof request.body === "string" || Buffer.isBuffer(request.body)) {
    return request.body
  }

  return new URLSearchParams(request.body ?? {}).toString()
}

export default async function proxyEasyEdaRequest(request, response) {
  if (request.method === "OPTIONS") {
    response.status(204).end()
    return
  }

  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("allow", "GET, POST, OPTIONS")
    response.status(405).json({ error: "Only GET and POST are allowed" })
    return
  }

  const targetUrl = getHeader(request.headers, "x-target-url")
  if (!targetUrl) {
    response.status(400).json({ error: "X-Target-Url header is required" })
    return
  }

  let target
  try {
    target = new URL(targetUrl)
  } catch {
    response.status(400).json({ error: "X-Target-Url must be a valid URL" })
    return
  }

  if (target.protocol !== "https:" || target.hostname !== EASYEDA_HOSTNAME) {
    response.status(403).json({ error: "Only EasyEDA requests are allowed" })
    return
  }

  const headers = {
    accept: getHeader(request.headers, "accept") ?? "*/*",
    "content-type": getHeader(request.headers, "content-type") ?? "",
    "x-requested-with": getHeader(request.headers, "x-requested-with") ?? "",
    origin: getHeader(request.headers, "x-sender-origin") ?? "",
    referer: getHeader(request.headers, "x-sender-referer") ?? "",
    "user-agent": getHeader(request.headers, "x-sender-user-agent") ?? "",
    cookie: getHeader(request.headers, "x-sender-cookie") ?? "",
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: getRequestBody(request),
    })
    const body = Buffer.from(await upstream.arrayBuffer())

    response.setHeader(
      "content-type",
      upstream.headers.get("content-type") ?? "application/octet-stream",
    )
    response.status(upstream.status).send(body)
  } catch {
    response.status(502).json({ error: "Failed to fetch from EasyEDA" })
  }
}
