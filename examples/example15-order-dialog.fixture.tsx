import { Label } from "@radix-ui/react-dropdown-menu"
import type { AnyCircuitElement } from "circuit-json"
import { useOrderDialog } from "lib/components/OrderDialog/useOrderDialog"
import { RunFrame } from "lib/components/RunFrame/RunFrame"
import { Button } from "lib/components/ui/button"
import React, { useEffect, useState } from "react"
import { registryKy } from "lib/utils/get-registry-ky"
import type { Package } from "@tscircuit/fake-snippets/schema"

const circuitJson: AnyCircuitElement[] = []

export default () => {
  const [packageReleaseId, setPackageReleaseId] = useState<string | undefined>(
    undefined,
  )

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Using the `/registry` path for the registry API
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
    }
  }, [])

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const getResponse = await registryKy.get("packages/get", {
          searchParams: { name: "testuser/my-test-board" },
        })
        const data = (await getResponse.json()) as { package: Package }
        setPackageReleaseId(data.package.latest_package_release_id ?? undefined)
      } catch (error) {
        console.error("Failed to fetch package:", error)
      }
    }

    fetchPackage()
  }, [])

  const [code, setCode] = useState(
    `
// edit me
circuit.add(
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
  )`.trim(),
  )

  const signIn = () => {
    return null
  }

  const orderDialog = useOrderDialog({
    onSignIn: signIn,
    isLoggedIn: true,
    packageReleaseId: packageReleaseId ?? "",
  })

  return (
    <div>
      <div className="m-2">
        <Label>Click to open the order dialog</Label>
        <Button variant="destructive" onClick={() => orderDialog.open()}>
          Order Now
        </Button>
      </div>
      <RunFrame
        fsMap={{
          "main.tsx": code,
        }}
        entrypoint="main.tsx"
        showRunButton={true}
      />
      <orderDialog.OrderDialog
        isOpen={orderDialog.isOpen}
        onClose={orderDialog.close}
        stage={orderDialog.stage}
        setStage={orderDialog.setStage}
        circuitJson={circuitJson}
      />
    </div>
  )
}
