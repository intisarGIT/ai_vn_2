import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { storyId, sceneNumber } = await request.json()

    if (!storyId || sceneNumber === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ------------------------------------------------------------------
    // Build an absolute URL that always points to this same deployment
    // ------------------------------------------------------------------
    const host = request.headers.get("host") ?? ""
    const protocol = host.startsWith("localhost") ? "http" : "https"
    const base = `${protocol}://${host}` // e.g. https://my-app.vercel.app
    const sceneEndpoint = `${base}/api/scene`

    console.log(`Pre-generating a_${sceneNumber + 1} and b_${sceneNumber + 1} via ${sceneEndpoint}`)

    // Kick off both requests in parallel (fire-and-forget)
    // We silently swallow any network error so the main request stays fast.
    Promise.allSettled([
      fetch(sceneEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          sceneNumber: sceneNumber + 1,
          isWrongPath: false,
          preGenerate: true,
        }),
      }),
      fetch(sceneEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          sceneNumber: sceneNumber + 1,
          isWrongPath: true,
          preGenerate: true,
        }),
      }),
    ]).catch((err) => {
      // Log but never crash the current response
      console.error("[Pre-generation] background error:", err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Pre-generation] top-level error:", error)
    return NextResponse.json({ error: "Pre-generation failed" }, { status: 500 })
  }
}
