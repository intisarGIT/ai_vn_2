import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase"

const supabase = createSupabaseServiceClient()

export async function POST(request: Request) {
  try {
    const { storyId } = await request.json()

    if (!storyId) {
      return NextResponse.json({ error: "Missing story ID" }, { status: 400 })
    }

    // Get story and user info
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, users(*)")
      .eq("id", storyId)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Get all scenes for this story in order
    const { data: scenes, error: scenesError } = await supabase
      .from("scenes")
      .select("*")
      .eq("story_id", storyId)
      .eq("is_main_path", true)
      .order("scene_number", { ascending: true })

    if (scenesError) {
      return NextResponse.json({ error: "Failed to fetch scenes" }, { status: 500 })
    }

    // Create storybook content
    const storybook = {
      title: `${story.users.name}'s ${story.genre} Adventure`,
      author: story.users.name,
      genre: story.genre,
      totalScenes: story.total_scenes,
      isVictory: story.is_victory,
      finalXMeter: story.x_meter,
      xMeterType: story.x_meter_type,
      createdAt: story.created_at,
      scenes: scenes?.map((scene, index) => ({
        sceneNumber: scene.scene_number,
        text: scene.text,
        imageUrl: scene.image_url,
        imagePrompt: scene.image_prompt,
      })) || [],
    }

    // In a real implementation, you would use a PDF library like jsPDF or puppeteer
    // For now, return the storybook data
    return NextResponse.json({
      success: true,
      storybook,
      downloadUrl: `/api/storybook/download/${storyId}`, // Future implementation
    })
  } catch (error) {
    console.error("Error generating storybook:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate storybook" },
      { status: 500 }
    )
  }
}
