"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useGameStore } from "@/lib/game-store"
import { Check, Coins, Star, Zap } from "lucide-react"

const creditPackages = [
  {
    name: "Starter",
    price: "$5",
    credits: 500,
    bonus: 0,
    description: "Perfect for trying out the game",
    features: ["500 Credits", "~50 Scenes", "Never Expires", "Instant Delivery"],
  },
  {
    name: "Casual",
    price: "$10",
    credits: 1200,
    bonus: 20,
    description: "Great for regular players",
    popular: true,
    features: ["1000 Base Credits", "200 Bonus Credits", "~120 Scenes", "Best Value"],
  },
  {
    name: "Hardcore",
    price: "$30",
    credits: 4500,
    bonus: 50,
    description: "Best value for dedicated adventurers",
    features: ["3000 Base Credits", "1500 Bonus Credits", "~450 Scenes", "Maximum Value"],
  },
]

export default function CreditsPage() {
  const { toast } = useToast()
  const { userInfo, updateCredits } = useGameStore()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handlePurchase = async (packageName: string, credits: number) => {
    setIsLoading(packageName)

    try {
      // In a real implementation, integrate with Paddle here
      // For now, simulate the purchase
      await new Promise((resolve) => setTimeout(resolve, 2000))

      updateCredits(credits)

      toast({
        title: "Purchase Successful!",
        description: `${credits} credits have been added to your account.`,
      })
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Purchase Credits</h1>
          <p className="text-xl text-gray-300 mb-2">Continue your adventure with more credits</p>
          <div className="inline-flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            <span className="text-white font-semibold">Current Credits: {userInfo?.credits || 0}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.name}
              className={`border-gray-700 bg-black/30 backdrop-blur-sm relative ${
                pkg.popular ? "ring-2 ring-purple-500 scale-105" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">{pkg.name}</CardTitle>
                <CardDescription className="text-gray-300">{pkg.description}</CardDescription>
                <div className="text-4xl font-bold text-white mt-4">{pkg.price}</div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{pkg.credits.toLocaleString()}</div>
                  <div className="text-gray-400">Total Credits</div>

                  {pkg.bonus > 0 && (
                    <div className="mt-2 inline-flex items-center space-x-1 bg-green-900/30 text-green-400 px-2 py-1 rounded-full text-sm">
                      <Zap className="h-3 w-3" />
                      <span>{pkg.bonus}% Bonus!</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.name, pkg.credits)}
                  disabled={isLoading === pkg.name}
                  className={`w-full ${
                    pkg.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {isLoading === pkg.name ? (
                    <>
                      <Coins className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4 mr-2" />
                      Purchase {pkg.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Card className="max-w-2xl mx-auto border-gray-700 bg-black/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-3">💡 How Credits Work</h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>• Each scene costs 10 credits (story generation + AI image)</p>
                <p>• Credits never expire and carry over between adventures</p>
                <p>• Wrong choices may cost additional credits for penalty scenes</p>
                <p>• Secure payments powered by Paddle with instant delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
