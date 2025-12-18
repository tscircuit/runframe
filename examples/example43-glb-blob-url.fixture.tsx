import { RunFrame } from "lib/components/RunFrame/RunFrame"
import testGlbUrl from "./assets/test.glb?url"
import { useState, useEffect } from "react"

function useGlbBlobUrl(url: string) {
  const [blobUrl, setBlobUrl] = useState<string>("")
  useEffect(() => {
    let revoke: (() => void) | undefined
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const bUrl = URL.createObjectURL(blob)
        setBlobUrl(bUrl)
        revoke = () => URL.revokeObjectURL(bUrl)
      })
    return () => {
      if (revoke) revoke()
    }
  }, [url])
  return blobUrl
}

export default () => {
  const testGlbUrlBlob = useGlbBlobUrl(testGlbUrl)

  console.log("[example43] testGlbUrlBlob:", testGlbUrlBlob, "length:", testGlbUrlBlob.length)

  if (!testGlbUrlBlob) {
    console.log("[example43] Showing loading state because blob URL is empty")
    return <div>Loading GLB file...</div>
  }

  console.log("[example43] Rendering RunFrame with blob URL:", testGlbUrlBlob.substring(0, 50))

  return (
    <RunFrame
      fsMap={{
        "main.tsx": `
import glbUrl from "./test.glb"
console.log("[example43] glbUrl value:", glbUrl)
circuit.add(
  <board width="10mm" height="10mm" thickness="0.1mm">
    <chip
      name="U1"
      footprint="soic8"
      cadModel={{
        gltfUrl: glbUrl,
        rotationOffset: { x: 90, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0.6 },
        modelUnitToMmScale: 1,
      }}
    />
  </board>
)
`,
        "test.glb": testGlbUrlBlob,
      }}
      entrypoint="main.tsx"
    />
  )
}
