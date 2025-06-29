import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

// Client-side Supabase client
export const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Service role client for admin operations
export const createSupabaseServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          gender: string
          email: string
          face_image_url: string
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          gender: string
          email: string
          face_image_url: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          gender?: string
          email?: string
          face_image_url?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          genre: string
          total_scenes: number
          current_scene: number
          x_meter: number
          x_meter_type: string
          is_completed: boolean
          is_victory: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          genre: string
          total_scenes: number
          current_scene?: number
          x_meter?: number
          x_meter_type: string
          is_completed?: boolean
          is_victory?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          genre?: string
          total_scenes?: number
          current_scene?: number
          x_meter?: number
          x_meter_type?: string
          is_completed?: boolean
          is_victory?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      scenes: {
        Row: {
          id: string
          story_id: string
          scene_number: number
          scene_key: string
          text: string[]
          image_prompt: string
          image_url: string | null
          options: string[]
          selected_option: string | null
          is_correct_path: boolean[]
          is_game_over: boolean
          is_main_path: boolean
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          scene_number: number
          scene_key: string
          text: string[]
          image_prompt: string
          image_url?: string | null
          options?: string[]
          selected_option?: string | null
          is_correct_path?: boolean[]
          is_game_over?: boolean
          is_main_path?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          scene_number?: number
          scene_key?: string
          text?: string[]
          image_prompt?: string
          image_url?: string | null
          options?: string[]
          selected_option?: string | null
          is_correct_path?: boolean[]
          is_game_over?: boolean
          is_main_path?: boolean
          created_at?: string
        }
      }
    }
  }
}
