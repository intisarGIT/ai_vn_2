"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Gamepad2, Sparkles, Zap } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/start")
    } else {
      router.push("/auth")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Visual Novel
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience personalized interactive stories powered by AI, featuring you as the main character
          </p>
        </div>

        <Card className="border-gray-700 bg-black/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-400" />
              Your Adventure Awaits
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Upload your photo, choose your genre, and dive into an AI-generated story where every choice matters
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="relative h-64 overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img
                src="/placeholder.svg?height=400&width=800"
                alt="Visual Novel Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 z-20">
                <h3 className="text-white text-xl font-semibold">Dynamic AI Storytelling</h3>
                <p className="text-gray-200">Every playthrough is unique</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 rounded-lg bg-purple-900/30 border border-purple-500/30">
                <BookOpen className="h-8 w-8 text-purple-400 mb-2" />
                <h4 className="text-white font-semibold mb-1">AI-Generated Stories</h4>
                <p className="text-gray-300 text-sm text-center">Powered by Mistral AI for rich, dynamic narratives</p>
              </div>

              <div className="flex flex-col items-center p-4 rounded-lg bg-blue-900/30 border border-blue-500/30">
                <Zap className="h-8 w-8 text-blue-400 mb-2" />
                <h4 className="text-white font-semibold mb-1">X Meter System</h4>
                <p className="text-gray-300 text-sm text-center">
                  Strategic choices affect your Health, Trust, or Reputation
                </p>
              </div>

              <div className="flex flex-col items-center p-4 rounded-lg bg-pink-900/30 border border-pink-500/30">
                <Gamepad2 className="h-8 w-8 text-pink-400 mb-2" />
                <h4 className="text-white font-semibold mb-1">Your Face, Your Story</h4>
                <p className="text-gray-300 text-sm text-center">
                  AI-generated images featuring you as the protagonist
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 rounded-lg border border-purple-500/30">
              <h4 className="text-white font-semibold mb-2">🎮 How It Works:</h4>
              <ol className="text-gray-300 space-y-1 text-sm">
                <li>1. Upload your photo and choose your adventure genre</li>
                <li>2. Make choices that shape your unique story path</li>
                <li>3. Watch as AI generates scenes featuring you as the hero</li>
                <li>4. Manage your X Meter - wrong choices have consequences!</li>
                <li>5. Download your complete adventure as a digital storybook</li>
              </ol>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
              disabled={isAuthenticated === null}
            >
              {isAuthenticated === null
                ? "Loading..."
                : isAuthenticated
                  ? "Continue Your Adventure"
                  : "Start Your Adventure"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
