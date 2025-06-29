import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase"

const supabase = createSupabaseServiceClient()

export async function POST(request: Request) {
  try {
    const { userId, genre } = await request.json()

    if (!userId || !genre) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user info
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate random story length between 20-30
    const totalScenes = Math.floor(Math.random() * 11) + 20

    // Determine X Meter type
    const xMeterTypes: Record<string, string> = {
      fantasy: "Health",
      romance: "Trust",
      adventure: "Health",
      mystery: "Reputation",
      horror: "Health",
      "sci-fi": "Health",
    }
    const xMeterType = xMeterTypes[genre] || "Health"

    // Create the story record with minimal data
    const { data: newStory, error: storyError } = await supabase
      .from("stories")
      .insert({
        user_id: userId,
        genre,
        total_scenes: totalScenes,
        x_meter_type: xMeterType,
      })
      .select()
      .single()

    if (storyError) {
      console.error("Error creating story:", storyError)
      return NextResponse.json({ error: "Failed to create story" }, { status: 500 })
    }

    console.log("Story created successfully:", newStory.id)

    return NextResponse.json({
      storyId: newStory.id,
      totalScenes,
      xMeterType,
    })
  } catch (error) {
    console.error("Error creating story:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create story" },
      { status: 500 },
    )
  }
}
