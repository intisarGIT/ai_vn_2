import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { storyId, sceneNumber } = await request.json()

    if (!storyId || sceneNumber === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Pre-generating scenes a_${sceneNumber + 1} and b_${sceneNumber + 1}`)

    // Pre-generate both next scenes in background
    const promises = [
      // Generate a_(n+1) - correct path
      fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          sceneNumber: sceneNumber + 1,
          isWrongPath: false,
          preGenerate: true,
        }),
      }),
      // Generate b_(n+1) - wrong path
      fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          sceneNumber: sceneNumber + 1,
          isWrongPath: true,
          preGenerate: true,
        }),
      }),
    ]

    // Don't wait for completion - fire and forget
    Promise.all(promises).catch((error) => {
      console.error("Pre-generation error:", error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in pre-generation:", error)
    return NextResponse.json({ error: "Pre-generation failed" }, { status: 500 })
  }
}
