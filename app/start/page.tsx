"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useGameStore } from "@/lib/game-store"
import { ImageUpload } from "@/components/image-upload"
import { createSupabaseClient } from "@/lib/supabase"
import { Loader2, User, Coins, LogOut, Play } from "lucide-react"

const getXMeterType = (genre: string): string => {
  const meterTypes: Record<string, string> = {
    fantasy: "Health",
    romance: "Trust",
    adventure: "Health",
    mystery: "Reputation",
    horror: "Health",
    "sci-fi": "Health",
  }
  return meterTypes[genre] || "Health"
}

export default function StartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { setUserInfo, setStoryId } = useGameStore()

  // Form state
  const [name, setName] = useState("")
  const [gender, setGender] = useState("")
  const [genre, setGenre] = useState("")
  const [faceImage, setFaceImage] = useState<File | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // User data
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [hasExistingStories, setHasExistingStories] = useState(false)

  const supabase = createSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/auth")
          return
        }

        setUser(session.user)

        // Check if user profile exists
        const { data: existingUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (existingUser) {
          setUserProfile(existingUser)
          setName(existingUser.name || "")
          setGender(existingUser.gender || "")

          // Check for existing incomplete stories
          const { data: stories } = await supabase
            .from("stories")
            .select("id, genre, is_completed")
            .eq("user_id", session.user.id)
            .eq("is_completed", false)
            .order("created_at", { ascending: false })

          if (stories && stories.length > 0) {
            setHasExistingStories(true)
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/auth")
      } finally {
        setIsPageLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleContinueExistingStory = async () => {
    if (!userProfile) return

    try {
      // Get the most recent incomplete story
      const { data: story } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (story) {
        // Set user info in game store
        setUserInfo({
          id: userProfile.id,
          name: userProfile.name,
          gender: userProfile.gender,
          email: userProfile.email,
          faceImageUrl: userProfile.face_image_url,
          genre: story.genre,
          credits: userProfile.credits,
          xMeter: story.x_meter,
          xMeterType: story.x_meter_type,
        })

        setStoryId(story.id)

        router.push("/game")
      }
    } catch (error) {
      console.error("Error continuing story:", error)
      toast({
        title: "Error",
        description: "Failed to continue existing story.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !gender || !genre) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!faceImage && !userProfile?.face_image_url) {
      toast({
        title: "Missing Face Image",
        description: "Please upload a face image to continue.",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let faceImageUrl = userProfile?.face_image_url || ""

      // Upload new face image if provided
      if (faceImage) {
        const fileExt = faceImage.name.split(".").pop()
        const fileName = `face-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("game-assets").upload(filePath, faceImage)

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("game-assets").getPublicUrl(filePath)

        faceImageUrl = publicUrl
      }

      // Update or create user profile
      const { error: userError } = await supabase.from("users").upsert({
        id: user.id,
        name,
        gender,
        email: user.email!,
        face_image_url: faceImageUrl,
        credits: userProfile?.credits || 100,
      })

      if (userError) {
        throw new Error(`Profile update failed: ${userError.message}`)
      }

      // Create story
      const storyResponse = await fetch("/api/story/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          genre,
        }),
      })

      if (!storyResponse.ok) {
        const errorData = await storyResponse.json()
        throw new Error(errorData.error || "Failed to create story")
      }

      const { storyId, totalScenes, xMeterType } = await storyResponse.json()

      // Set user info in the game store
      setUserInfo({
        id: user.id,
        name,
        gender,
        email: user.email!,
        faceImageUrl,
        genre,
        credits: userProfile?.credits || 100,
        xMeter: 100,
        xMeterType,
      })

      setStoryId(storyId)

      toast({
        title: "Adventure Created!",
        description: `Your ${genre} adventure is ready to begin.`,
      })

      router.push("/game")
    } catch (error) {
      console.error("Error starting game:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start the game. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isPageLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
          <p className="text-white text-lg">Loading your profile...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-700 bg-black/30 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {userProfile?.name ? `Welcome back, ${userProfile.name}!` : "Create Your Character"}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {userProfile?.name ? "Start a new adventure or continue existing one" : "Set up your profile to begin"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-400 hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {userProfile && (
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <Coins className="h-4 w-4 text-yellow-400" />
                <span className="text-white font-semibold">{userProfile.credits} Credits</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300 text-sm">{user?.email}</span>
              </div>
            </div>
          )}
        </CardHeader>

        {hasExistingStories && (
          <CardContent className="pt-0">
            <Button onClick={handleContinueExistingStory} className="w-full mb-4 bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Continue Existing Adventure
            </Button>
            <div className="text-center text-sm text-gray-400 mb-4">
              <span>or create a new adventure below</span>
            </div>
          </CardContent>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Your Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your character name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Gender (for pronouns)</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="text-white">
                    Male
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="text-white">
                    Female
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="neutral" />
                  <Label htmlFor="neutral" className="text-white">
                    Neutral
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre" className="text-white">
                Story Genre
              </Label>
              <Select value={genre} onValueChange={setGenre} required>
                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fantasy">Fantasy ({getXMeterType("fantasy")} Meter)</SelectItem>
                  <SelectItem value="sci-fi">Science Fiction ({getXMeterType("sci-fi")} Meter)</SelectItem>
                  <SelectItem value="horror">Horror ({getXMeterType("horror")} Meter)</SelectItem>
                  <SelectItem value="romance">Romance ({getXMeterType("romance")} Meter)</SelectItem>
                  <SelectItem value="mystery">Mystery ({getXMeterType("mystery")} Meter)</SelectItem>
                  <SelectItem value="adventure">Adventure ({getXMeterType("adventure")} Meter)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Your Face Image</Label>
              <ImageUpload
                onImageSelected={setFaceImage}
                className="w-full h-48"
                existingImageUrl={userProfile?.face_image_url}
              />
              {userProfile?.face_image_url && !faceImage && (
                <p className="text-xs text-gray-400">Using existing image. Upload a new one to replace it.</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Adventure...
                </>
              ) : (
                "Begin New Adventure"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
