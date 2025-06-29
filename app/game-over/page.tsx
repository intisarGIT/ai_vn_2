"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useGameStore } from "@/lib/game-store"
import { Download, Home, RotateCcw, Trophy, Skull, BookOpen } from "lucide-react"

export default function GameOverPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userInfo, storyId, gamePhase, resetGame } = useGameStore()
  const [isGeneratingStorybook, setIsGeneratingStorybook] = useState(false)

  const isVictory = gamePhase === "victory"

  useEffect(() => {
    if (!userInfo || !storyId) {
      router.push("/")
    }
  }, [userInfo, storyId, router])

  const handleDownloadStorybook = async () => {
    if (!storyId) return

    setIsGeneratingStorybook(true)
    try {
      // Generate storybook via API
      const response = await fetch("/api/storybook/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate storybook")
      }

      const { storybook } = await response.json()

      // Create a simple HTML version of the storybook
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${storybook.title}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .cover { text-align: center; margin-bottom: 40px; }
            .scene { margin-bottom: 30px; page-break-inside: avoid; }
            .scene-image { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px; }
            .scene-text { line-height: 1.6; margin-bottom: 10px; }
            .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="cover">
            <h1>${storybook.title}</h1>
            <h2>A ${storybook.genre} Adventure</h2>
            <p>By ${storybook.author}</p>
            <p>Generated on ${new Date(storybook.createdAt).toLocaleDateString()}</p>
          </div>
          
          ${storybook.scenes.map((scene, index) => `
            <div class="scene">
              <h3>Scene ${scene.sceneNumber}</h3>
              ${scene.imageUrl && scene.imageUrl !== "/placeholder.svg?height=600&width=800" ? 
                `<img src="${scene.imageUrl}" alt="Scene ${scene.sceneNumber}" class="scene-image" />` : 
                ''}
              ${scene.text.map(text => `<p class="scene-text">${text}</p>`).join('')}
            </div>
          `).join('')}
          
          <div class="stats">
            <h3>Adventure Statistics</h3>
            <p><strong>Total Scenes:</strong> ${storybook.totalScenes}</p>
            <p><strong>Final ${storybook.xMeterType}:</strong> ${storybook.finalXMeter}/100</p>
            <p><strong>Result:</strong> ${storybook.isVictory ? "Victory!" : "Defeat"}</p>
          </div>
        </body>
        </html>
      `

      // Create and download the HTML file
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${userInfo?.name}-adventure-storybook.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Storybook Generated!",
        description: "Your adventure storybook has been downloaded.",
      })
    } catch (error) {
      console.error("Error generating storybook:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate your storybook. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingStorybook(false)
    }
  }

  const handlePlayAgain = () => {
    resetGame()
    router.push("/start")
  }

  const handleGoHome = () => {
    resetGame()
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-700 bg-black/30 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isVictory ? (
              <Trophy className="h-16 w-16 text-yellow-400" />
            ) : (
              <Skull className="h-16 w-16 text-red-400" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">{isVictory ? "Victory!" : "Game Over"}</CardTitle>
          <CardDescription className="text-gray-300">
            {isVictory
              ? "Congratulations! You've successfully completed your adventure!"
              : `Your ${userInfo?.xMeterType || "Health"} reached zero. Your adventure has come to an end.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {userInfo && (
            <div className="text-center space-y-2 p-4 bg-gray-800/30 rounded-lg">
              <div className="text-white">
                <span className="text-gray-400">Final {userInfo.xMeterType}:</span>{" "}
                <span className={isVictory ? "text-green-400" : "text-red-400"}>{userInfo.xMeter}/100</span>
              </div>
              <div className="text-white">
                <span className="text-gray-400">Remaining Credits:</span>{" "}
                <span className="text-yellow-400">{userInfo.credits}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleDownloadStorybook}
              disabled={isGeneratingStorybook}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGeneratingStorybook ? (
                <>
                  <BookOpen className="h-4 w-4 mr-2 animate-pulse" />
                  Generating Storybook...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Your Storybook
                </>
              )}
            </Button>

            <Button
              onClick={handlePlayAgain}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
