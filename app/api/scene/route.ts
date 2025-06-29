import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase"
import { Mistral } from "@mistralai/mistralai"

// Initialize clients
const supabase = createSupabaseServiceClient()
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
})

// LumaLabs configuration
const LUMA_API_URL = "https://api.lumalabs.ai/dream-machine/v1/generations/image"
const LUMA_STATUS_URL = "https://api.lumalabs.ai/dream-machine/v1/generations"

function extractJsonFromString(str: string): string {
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
  const match = str.match(jsonBlockRegex)
  return match && match[1] ? match[1].trim() : str.trim()
}

function isValidUrl(u: string | null | undefined) {
  try {
    if (!u) return false
    new URL(u)
    return true
  } catch {
    return false
  }
}

const PLACEHOLDER = "/placeholder.svg?height=600&width=800"

async function generateImageWithLuma(promptRaw: string, characterReferenceUrl: string): Promise<string> {
  if (!process.env.LUMA_API_KEY) {
    console.log("[LumaLabs] No API key configured - returning placeholder")
    return PLACEHOLDER
  }
  if (!isValidUrl(characterReferenceUrl)) {
    console.warn("[LumaLabs] Invalid face reference – returning placeholder")
    return PLACEHOLDER
  }

  const prompt = `${promptRaw.trim().slice(0, 180)}, high contrast, cinematic lighting`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const createRes = await fetch(LUMA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: "photon-1",
        prompt,
        character_ref: {
          identity0: { images: [characterReferenceUrl] },
        },
      }),
      signal: controller.signal,
    })

    if (!createRes.ok) {
      console.error("[LumaLabs] create error", createRes.status, await createRes.text())
      return PLACEHOLDER
    }

    const { id: generationId } = (await createRes.json()) as { id?: string }
    if (!generationId) return PLACEHOLDER

    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const poll = await fetch(`${LUMA_STATUS_URL}/${generationId}`, {
        headers: {
          Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
          Accept: "application/json",
        },
      }).catch(() => null)

      if (!poll || !poll.ok) continue
      const data = await poll.json()
      if (data.state === "completed" && data.assets?.image) return data.assets.image
      if (data.state === "failed") break
    }

    console.warn("[LumaLabs] timeout – returning placeholder")
    return PLACEHOLDER
  } catch (err) {
    console.error("[LumaLabs] fetch threw", err)
    return PLACEHOLDER
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Guarantees a placeholder string instead of a thrown exception.
 * We still log the root cause for observability.
 */
async function safeGenerateImage(prompt: string, refUrl: string): Promise<string> {
  try {
    return await generateImageWithLuma(prompt, refUrl)
  } catch (err) {
    console.error("[LumaLabs] unrecoverable, returning placeholder →", err)
    return PLACEHOLDER
  }
}

let imageUrl = PLACEHOLDER

export async function POST(request: Request) {
  try {
    const { storyId, sceneNumber, isWrongPath = false, previousChoice = "", preGenerate = false } = await request.json()

    console.log("Scene generation request:", { storyId, sceneNumber, isWrongPath, preGenerate })

    if (!storyId || sceneNumber === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get story and user info
    const { data: story, error: storyError } = await supabase.from("stories").select("*").eq("id", storyId).single()

    if (storyError || !story) {
      console.error("Story error:", storyError)
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", story.user_id).single()

    if (userError || !user) {
      console.error("User error:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // For pre-generation, don't check credits (it's background processing)
    if (!preGenerate && user.credits < 10) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    // Generate scene key
    const sceneKey = isWrongPath ? `b_${sceneNumber}` : `a_${sceneNumber}`

    // Check if this scene already exists
    const { data: existingScene } = await supabase
      .from("scenes")
      .select("*")
      .eq("story_id", storyId)
      .eq("scene_key", sceneKey)
      .single()

    if (existingScene) {
      console.log(`Scene ${sceneKey} found in cache`)
      return NextResponse.json({
        sceneKey,
        text: existingScene.text,
        imageUrl: existingScene.image_url,
        options: existingScene.options ?? [],
        cached: true,
      })
    }

    // If this is a wrong path scene requested during gameplay (not pre-generation),
    // it should have been pre-generated. Return an error or fallback.
    if (isWrongPath && !preGenerate) {
      console.error(`Wrong path scene ${sceneKey} was not pre-generated!`)
      // Create a fallback scene without image generation
      const fallbackScene = {
        text: [
          "Your choice leads to unexpected consequences.",
          `${user.name} faces the results of this decision.`,
          "Perhaps it's time to reconsider your approach.",
        ],
        image_prompt: "placeholder scene",
        image_url: PLACEHOLDER,
        options: ["Go back"],
      }

      // Save fallback scene
      await supabase.from("scenes").insert({
        story_id: storyId,
        scene_number: sceneNumber,
        scene_key: sceneKey,
        text: fallbackScene.text,
        image_prompt: fallbackScene.image_prompt,
        image_url: fallbackScene.image_url,
        options: fallbackScene.options,
        is_correct_path: [false],
        is_game_over: false,
        is_main_path: false,
      })

      return NextResponse.json({
        sceneKey,
        text: fallbackScene.text,
        imageUrl: fallbackScene.image_url,
        options: fallbackScene.options,
        cached: false,
      })
    }

    // Build context for scene generation
    const pronouns =
      user.gender === "male" ? "he/him/his" : user.gender === "female" ? "she/her/hers" : "they/them/theirs"
    const subject = user.gender === "male" ? "a man" : user.gender === "female" ? "a woman" : "a person"

    // Get previous scenes for context
    const { data: previousScenes } = await supabase
      .from("scenes")
      .select("image_prompt")
      .eq("story_id", storyId)
      .eq("is_main_path", true)
      .order("scene_number", { ascending: true })

    let characterClothing = ""
    if (previousScenes && previousScenes.length > 0) {
      const firstScene = previousScenes[0]
      if (firstScene.image_prompt) {
        const match = firstScene.image_prompt.match(/wearing ([^,]+)/i)
        if (match) {
          characterClothing = `wearing ${match[1]}`
        }
      }
    }

    // Determine scene type
    const isFirstScene = sceneNumber === 1 && !isWrongPath
    const isGameOver = sceneNumber > story.total_scenes
    const isVictory = isGameOver && story.x_meter > 0

    let systemPrompt = ""
    let sceneData: any = {}

    if (isFirstScene) {
      systemPrompt = `You are creating the opening scene of a ${story.genre} visual novel for ${user.name}.
      
      Your response must be in JSON format:
      {
        "text": ["line1", "line2", "line3"],
        "image_prompt": "structured image prompt",
        "options": ["option1", "option2"]
      }
      
      The text should introduce the adventure and set the scene.
      The image_prompt should describe: "${subject}, wearing [appropriate ${story.genre} clothing], [action], [scene setting], face visible, cinematic"
      The options should be 2 different choices for the player.
      
      IMPORTANT: Return ONLY the JSON object without markdown formatting.`

      const response = await mistral.chat.complete({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create the opening scene for ${user.name}'s ${story.genre} adventure.` },
        ],
      })

      const responseContent = response.choices[0].message.content
      const jsonContent = extractJsonFromString(responseContent)

      try {
        sceneData = JSON.parse(jsonContent)
      } catch {
        sceneData = {
          text: [
            `Welcome ${user.name} to your ${story.genre} adventure.`,
            "Your journey begins in a world full of mystery and danger.",
            "Every choice you make will shape your destiny.",
          ],
          image_prompt: `${subject}, wearing appropriate ${story.genre} clothing, standing ready, epic ${story.genre} setting, face visible, cinematic`,
          options: ["Begin adventure", "Look around first"],
        }
      }
    } else if (isWrongPath) {
      systemPrompt = `You are creating a penalty scene for a wrong choice in a ${story.genre} visual novel.
      
      Your response must be in JSON format:
      {
        "text": ["line1", "line2", "line3"],
        "image_prompt": "structured image prompt",
        "options": ["Go back"]
      }
      
      The text should show negative consequences of the previous choice.
      The image_prompt should describe: "${subject}, ${characterClothing || "wearing consistent clothing"}, [consequence action], [scene setting], face visible, cinematic"
      
      IMPORTANT: Return ONLY the JSON object without markdown formatting.`

      const response = await mistral.chat.complete({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a penalty scene showing consequences of choosing: "${previousChoice}"` },
        ],
      })

      const responseContent = response.choices[0].message.content
      const jsonContent = extractJsonFromString(responseContent)

      try {
        sceneData = JSON.parse(jsonContent)
      } catch {
        sceneData = {
          text: [
            "Your choice leads to unexpected consequences.",
            `${user.name} faces the results of this decision.`,
            "Perhaps it's time to reconsider your approach.",
          ],
          image_prompt: `${subject}, ${characterClothing || "wearing consistent clothing"}, dealing with consequences, challenging ${story.genre} scene, face visible, cinematic`,
          options: ["Go back"],
        }
      }
    } else if (isGameOver) {
      sceneData = {
        text: isVictory
          ? [
              `Congratulations ${user.name}! You have completed your ${story.genre} adventure.`,
              "Through courage and wisdom, you have overcome all challenges.",
              "Your legend will be remembered forever.",
            ]
          : [
              `Your ${story.genre} adventure has come to an end.`,
              `${user.name}'s journey concludes here.`,
              "Every ending is a new beginning.",
            ],
        image_prompt: `${subject}, ${characterClothing || "wearing consistent clothing"}, ${isVictory ? "celebrating victory" : "facing the end"}, epic ${story.genre} finale, face visible, cinematic`,
        options: [],
      }
    } else {
      systemPrompt = `You are creating scene ${sceneNumber} of a ${story.genre} visual novel for ${user.name}.
      
      Your response must be in JSON format:
      {
        "text": ["line1", "line2", "line3"],
        "image_prompt": "structured image prompt",
        "options": ["option1", "option2"]
      }
      
      The text should continue the adventure story.
      The image_prompt should describe: "${subject}, ${characterClothing || "wearing consistent clothing"}, [action], [scene setting], face visible, cinematic"
      The options should be 2 different choices for the player.
      
      IMPORTANT: Keep clothing consistent with previous scenes.
      IMPORTANT: Return ONLY the JSON object without markdown formatting.`

      const response = await mistral.chat.complete({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Continue the ${story.genre} adventure for ${user.name}. Previous choice: "${previousChoice}"`,
          },
        ],
      })

      const responseContent = response.choices[0].message.content
      const jsonContent = extractJsonFromString(responseContent)

      try {
        sceneData = JSON.parse(jsonContent)
      } catch {
        sceneData = {
          text: [
            `${user.name} continues the ${story.genre} journey.`,
            "A new challenge appears on the path ahead.",
            "What will you choose to do?",
          ],
          image_prompt: `${subject}, ${characterClothing || "wearing consistent clothing"}, facing challenge, ${story.genre} environment, face visible, cinematic`,
          options: ["Take action", "Be cautious"],
        }
      }
    }

    // Generate image - only for main path scenes or during pre-generation

    if (!isWrongPath || preGenerate) {
      try {
        console.log(`Generating image for ${sceneKey} with LumaLabs...`)
        imageUrl = await safeGenerateImage(sceneData.image_prompt, user.face_image_url)
        console.log(`Image generated for ${sceneKey}: ${imageUrl}`)
      } catch (err) {
        console.error(`[LumaLabs] Error generating image for ${sceneKey}:`, err)
        imageUrl = PLACEHOLDER
      }
    } else {
      console.log(`Skipping image generation for wrong path scene ${sceneKey}`)
    }

    // Save scene to database
    const { error: insertError } = await supabase.from("scenes").insert({
      story_id: storyId,
      scene_number: sceneNumber,
      scene_key: sceneKey,
      text: sceneData.text,
      image_prompt: sceneData.image_prompt,
      image_url: imageUrl,
      options: sceneData.options ?? [],
      is_correct_path: isWrongPath ? [false] : [true, false],
      is_game_over: isGameOver,
      is_main_path: !isWrongPath,
    })

    if (insertError) {
      console.error("Error inserting scene:", insertError)
      return NextResponse.json({ error: "Failed to save scene" }, { status: 500 })
    }

    // Deduct credits from user (only for actual gameplay, not pre-generation)
    if (!preGenerate) {
      const { error: creditError } = await supabase
        .from("users")
        .update({ credits: user.credits - 10 })
        .eq("id", user.id)

      if (creditError) {
        console.error("Error updating credits:", creditError)
      }
    }

    console.log("Scene generated successfully:", sceneKey)

    return NextResponse.json({
      sceneKey,
      text: sceneData.text,
      imageUrl,
      options: sceneData.options || [],
      cached: false,
    })
  } catch (error) {
    console.error("Error generating scene:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate scene" },
      { status: 500 },
    )
  }
}
