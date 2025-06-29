"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createSupabaseClient } from "@/lib/supabase"
import { Loader2, Heart, Shield, Users, Eye, Zap, Coins } from "lucide-react"

const supabase = createSupabaseClient()

// X Meter icon mapping
const getMeterIcon = (meterType: string) => {
  const icons = {
    Health: Heart,
    Trust: Shield,
    Reputation: Users,
    default: Eye,
  }
  const IconComponent = icons[meterType as keyof typeof icons] || icons.default
  return <IconComponent className="h-4 w-4" />
}

export default function GamePage() {
  const router = useRouter()
  const { toast } = useToast()

  // Game state from store
  const { userInfo, storyId, updateXMeter, updateCredits, setGamePhase } = useGameStore()

  // Local state
  const [isLoading, setIsLoading] = useState(true)
  const [isDeciding, setIsDeciding] = useState(false)
  const [currentStory, setCurrentStory] = useState<any>(null)
  const [currentSceneData, setCurrentSceneData] = useState<any>(null)
  const [currentImage, setCurrentImage] = useState<string>("")
  const [isWrongPath, setIsWrongPath] = useState(false)

  useEffect(() => {
    if (!userInfo || !storyId) {
      router.push("/")
      return
    }

    const loadGameState = async () => {
      setIsLoading(true)
      try {
        // Get current story state
        const { data: story, error: storyError } = await supabase.from("stories").select("*").eq("id", storyId).single()

        if (storyError) throw storyError

        setCurrentStory(story)

        // Check if game is completed
        if (story.is_completed) {
          setGamePhase(story.is_victory ? "victory" : "game-over")
          router.push("/game-over")
          return
        }

        // Load current scene
        await loadScene(story.current_scene, false)

        // Pre-generate next scenes if this is a main path scene
        if (story.current_scene < story.total_scenes) {
          preGenerateScenes(story.current_scene)
        }
      } catch (error) {
        console.error("Error loading game state:", error)
        toast({
          title: "Error",
          description: "Failed to load the game. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGameState()
  }, [router, storyId, userInfo, setGamePhase])

  const loadScene = async (sceneNumber: number, wrongPath: boolean, previousChoice = "") => {
    try {
      setIsWrongPath(wrongPath)

      console.log(`Loading scene: ${wrongPath ? "b" : "a"}_${sceneNumber}`)

      // Generate scene on-demand
      const response = await fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          sceneNumber,
          isWrongPath: wrongPath,
          previousChoice,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load scene")
      }

      const sceneData = await response.json()

      setCurrentSceneData({
        text: sceneData.text,
        options: sceneData.options,
      })

      setCurrentImage(sceneData.imageUrl)
      console.log(`Scene loaded: ${sceneData.sceneKey}, cached: ${sceneData.cached}`)
    } catch (error) {
      console.error("Error loading scene:", error)
      throw error
    }
  }

  const preGenerateScenes = async (currentSceneNumber: number) => {
    try {
      console.log(`Starting pre-generation for scenes after ${currentSceneNumber}`)
      // Fire and forget - pre-generate next scenes in background
      fetch("/api/pregenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          sceneNumber: currentSceneNumber,
        }),
      }).catch((error) => {
        console.error("Pre-generation failed:", error)
      })
    } catch (error) {
      console.error("Error starting pre-generation:", error)
    }
  }

  const handleChoice = async (optionIndex: number) => {
    if (!currentStory || !currentSceneData || isDeciding) return

    setIsDeciding(true)

    try {
      const option = currentSceneData.options[optionIndex]

      if (option === "Go back") {
        // Handle go back from wrong path - no credit deduction
        await loadScene(currentStory.current_scene, false)
        return
      }

      // Determine if this is a wrong choice (second option is usually wrong)
      const isWrongChoice = !isWrongPath && optionIndex === 1

      if (isWrongChoice) {
        // Reduce X Meter
        const newXMeter = Math.max(0, userInfo!.xMeter - 10)
        updateXMeter(-10)

        // Update story X meter
        const { error: updateError } = await supabase.from("stories").update({ x_meter: newXMeter }).eq("id", storyId)

        if (updateError) throw updateError

        toast({
          title: "Wrong Choice!",
          description: `Your ${userInfo?.xMeterType} decreased by 10.`,
          variant: "destructive",
        })

        // Check if game over
        if (newXMeter <= 0) {
          await supabase.from("stories").update({ is_completed: true, is_victory: false }).eq("id", storyId)
          setGamePhase("game-over")
          router.push("/game-over")
          return
        }

        // Load wrong path scene (should be pre-generated)
        await loadScene(currentStory.current_scene + 1, true, option)
      } else {
        // Advance to next scene
        const nextScene = currentStory.current_scene + 1

        // Check win condition
        if (nextScene > currentStory.total_scenes) {
          await supabase.from("stories").update({ is_completed: true, is_victory: true }).eq("id", storyId)
          setGamePhase("victory")
          router.push("/game-over")
          return
        }

        // Update story progress
        const { error: updateError } = await supabase
          .from("stories")
          .update({ current_scene: nextScene })
          .eq("id", storyId)

        if (updateError) throw updateError

        // Load next scene (should be pre-generated)
        await loadScene(nextScene, false, option)

        // Update current story state
        setCurrentStory({ ...currentStory, current_scene: nextScene })

        // Deduct credits
        updateCredits(-10)

        // Pre-generate next set of scenes
        if (nextScene < currentStory.total_scenes) {
          preGenerateScenes(nextScene)
        }
      }
    } catch (error) {
      console.error("Error processing choice:", error)
      toast({
        title: "Error",
        description: "Failed to process your choice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeciding(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
          <p className="text-white text-lg">Loading your adventure...</p>
        </div>
      </main>
    )
  }

  const storyProgress = currentStory ? (currentStory.current_scene / currentStory.total_scenes) * 100 : 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentImage && currentImage !== "/placeholder.svg?height=600&width=800" ? (
          <img
            src={currentImage || "/placeholder.svg"}
            alt="Scene background"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Status Bar */}
        <div className="p-4 flex justify-between items-center">
          <div className="flex space-x-4">
            {/* X Meter */}
            <Card className="bg-black/70 backdrop-blur-sm border-gray-600">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  {getMeterIcon(userInfo?.xMeterType || "Health")}
                  <span className="text-white text-sm font-medium">{userInfo?.xMeterType || "Health"}</span>
                </div>
                <Progress value={userInfo?.xMeter || 0} className="w-24 h-2" />
                <div className="text-white text-xs mt-1">{userInfo?.xMeter || 0}/100</div>
              </CardContent>
            </Card>

            {/* Credits */}
            <Card className="bg-black/70 backdrop-blur-sm border-gray-600">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-white text-sm font-medium">{userInfo?.credits || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          <Card className="bg-black/70 backdrop-blur-sm border-gray-600">
            <CardContent className="p-3">
              <div className="text-white text-sm font-medium mb-1">Progress</div>
              <Progress value={storyProgress} className="w-32 h-2" />
              <div className="text-white text-xs mt-1">{Math.round(storyProgress)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Story Content */}
        <div className="flex-1 flex flex-col justify-center p-4">
          <Card className="max-w-4xl mx-auto bg-black/80 backdrop-blur-sm border-gray-600">
            <CardContent className="p-8">
              {currentSceneData ? (
                <div className="space-y-6">
                  {/* Story Text */}
                  <div className="space-y-3">
                    {currentSceneData.text.map((line: string, index: number) => (
                      <p key={index} className="text-white text-lg leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Decision Options */}
                  {currentSceneData.options && currentSceneData.options.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <h3 className="text-white text-lg font-semibold mb-4">What do you choose?</h3>
                      {currentSceneData.options.map((option: string, index: number) => (
                        <Button
                          key={index}
                          onClick={() => handleChoice(index)}
                          disabled={isDeciding}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-left justify-start p-4 h-auto"
                        >
                          <div className="flex items-center space-x-3">
                            {index === 0 ? <Zap className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                            <span>{option}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {isDeciding && (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400 mx-auto mb-2" />
                      <p className="text-gray-300">Processing your choice...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-white text-lg">Loading scene...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
