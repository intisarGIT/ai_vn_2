import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface UserInfo {
  id: string
  name: string
  gender: string
  email: string
  faceImageUrl: string
  genre: string
  credits: number
  xMeter: number
  xMeterType: string
}

interface GameState {
  userInfo: UserInfo | null
  storyId: string | null
  gamePhase: "setup" | "playing" | "game-over" | "victory"

  // Actions
  setUserInfo: (info: UserInfo) => void
  setStoryId: (id: string | null) => void
  updateXMeter: (change: number) => void
  updateCredits: (change: number) => void
  setGamePhase: (phase: GameState["gamePhase"]) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      userInfo: null,
      storyId: null,
      gamePhase: "setup",

      setUserInfo: (info) => set({ userInfo: info }),

      setStoryId: (id) => set({ storyId: id }),

      updateXMeter: (change) =>
        set((state) => {
          if (!state.userInfo) return state
          const newXMeter = Math.max(0, Math.min(100, state.userInfo.xMeter + change))
          const newGamePhase = newXMeter <= 0 ? "game-over" : state.gamePhase

          return {
            userInfo: { ...state.userInfo, xMeter: newXMeter },
            gamePhase: newGamePhase,
          }
        }),

      updateCredits: (change) =>
        set((state) => {
          if (!state.userInfo) return state
          const newCredits = Math.max(0, state.userInfo.credits + change)
          return { userInfo: { ...state.userInfo, credits: newCredits } }
        }),

      setGamePhase: (phase) => set({ gamePhase: phase }),

      resetGame: () =>
        set({
          storyId: null,
          gamePhase: "setup",
        }),
    }),
    {
      name: "visual-novel-store",
    },
  ),
)
