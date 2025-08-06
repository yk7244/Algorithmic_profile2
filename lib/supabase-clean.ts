import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database Types (Clean PostgreSQL Version - snake_case 테이블명)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string | null
          avatar_url: string | null
          provider: string
          background_color: string
          open_to_connect: boolean
          last_analysis_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname?: string | null
          avatar_url?: string | null
          provider: string
          background_color?: string
          open_to_connect?: boolean
          last_analysis_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string | null
          avatar_url?: string | null
          provider?: string
          background_color?: string
          open_to_connect?: boolean
          last_analysis_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          title: string
          description: string | null
          channel_id: string | null
          channel_name: string | null
          published_at: string | null
          thumbnail_url: string | null
          view_count: number | null
          like_count: number | null
          comment_count: number | null
          url: string | null
          tags: string[] | null
          keywords: string[] | null
          last_fetched_at: string
          created_at: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          channel_id?: string | null
          channel_name?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          view_count?: number | null
          like_count?: number | null
          comment_count?: number | null
          url?: string | null
          tags?: string[] | null
          keywords?: string[] | null
          last_fetched_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          channel_id?: string | null
          channel_name?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          view_count?: number | null
          like_count?: number | null
          comment_count?: number | null
          url?: string | null
          tags?: string[] | null
          keywords?: string[] | null
          last_fetched_at?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          nickname: string
          main_description: string
          background_color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname: string
          main_description: string
          background_color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          main_description?: string
          background_color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      watch_history: {
        Row: {
          id: string
          user_id: string
          video_id: string | null
          title: string
          description: string | null
          tags: string[] | null
          keywords: string[] | null
          watch_date: string | null
          analysis_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id?: string | null
          title: string
          description?: string | null
          tags?: string[] | null
          keywords?: string[] | null
          watch_date?: string | null
          analysis_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string | null
          title?: string
          description?: string | null
          tags?: string[] | null
          keywords?: string[] | null
          watch_date?: string | null
          analysis_date?: string
          created_at?: string
        }
      }
      cluster_history: {
        Row: {
          id: string
          user_id: string
          profile_id: string | null
          nickname: string
          description: string
          images_data: any // JSONB - ImageData[]
          analysis_data: any | null // JSONB
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id?: string | null
          nickname: string
          description: string
          images_data: any
          analysis_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string | null
          nickname?: string
          description?: string
          images_data?: any
          analysis_data?: any | null
          created_at?: string
        }
      }
      image_data: {
        Row: {
          id: string
          user_id: string
          cluster_id: string | null
          main_keyword: string
          keywords: string[]
          mood_keyword: string | null
          description: string | null
          category: string | null
          image_url: string
          width: number
          height: number
          size_weight: number
          position_x: number
          position_y: number
          rotate: number
          css_left: string | null
          css_top: string | null
          frame_style: string
          related_videos: any // JSONB
          desired_self: boolean
          desired_self_profile: any // JSONB
          metadata: any // JSONB
          similarity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cluster_id?: string | null
          main_keyword: string
          keywords: string[]
          mood_keyword?: string | null
          description?: string | null
          category?: string | null
          image_url: string
          width?: number
          height?: number
          size_weight?: number
          position_x?: number
          position_y?: number
          rotate?: number
          css_left?: string | null
          css_top?: string | null
          frame_style?: string
          related_videos?: any
          desired_self?: boolean
          desired_self_profile?: any
          metadata?: any
          similarity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cluster_id?: string | null
          main_keyword?: string
          keywords?: string[]
          mood_keyword?: string | null
          description?: string | null
          category?: string | null
          image_url?: string
          width?: number
          height?: number
          size_weight?: number
          position_x?: number
          position_y?: number
          rotate?: number
          css_left?: string | null
          css_top?: string | null
          frame_style?: string
          related_videos?: any
          desired_self?: boolean
          desired_self_profile?: any
          metadata?: any
          similarity?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      slider_history: {
        Row: {
          id: string
          user_id: string
          version_type: 'upload' | 'self'
          nickname: string
          description: string
          background_color: string | null
          images_data: any // JSONB
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          version_type: 'upload' | 'self'
          nickname: string
          description: string
          background_color?: string | null
          images_data: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          version_type?: 'upload' | 'self'
          nickname?: string
          description?: string
          background_color?: string | null
          images_data?: any
          created_at?: string
        }
      }
      reflections: {
        Row: {
          id: string
          user_id: string
          reflection1_completed: boolean
          reflection2_completed: boolean
          searched: boolean
          tutorial: boolean  // ✅ 실제 DB 스키마에 맞게 수정
          reflection1_answers: any | null // JSONB
          reflection2_answers: any | null // JSONB
          timestamp: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reflection1_completed?: boolean
          reflection2_completed?: boolean
          searched?: boolean
          tutorial?: boolean  // ✅ 실제 DB 스키마에 맞게 수정
          reflection1_answers?: any | null
          reflection2_answers?: any | null
          timestamp?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reflection1_completed?: boolean
          reflection2_completed?: boolean
          searched?: boolean
          tutorial?: boolean  // ✅ 실제 DB 스키마에 맞게 수정
          reflection1_answers?: any | null
          reflection2_answers?: any | null
          timestamp?: string
          created_at?: string
          updated_at?: string
        }
      }
      reflection_answers: {
        Row: {
          id: string
          user_id: string
          reflection_data: any // JSONB
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reflection_data: any
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reflection_data?: any
          timestamp?: string
          created_at?: string
        }
      }
      thumbnail_cache: {
        Row: {
          id: string
          main_keyword: string
          image_url: string
          search_query: string | null
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          main_keyword: string
          image_url: string
          search_query?: string | null
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          main_keyword?: string
          image_url?: string
          search_query?: string | null
          source?: string | null
          created_at?: string
        }
      }
      parse_history: {
        Row: {
          id: string
          user_id: string
          channel: string | null
          date: string | null
          keyword: string[] | null
          tags: string[] | null
          title: string | null
          video_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          channel?: string | null
          date?: string | null
          keyword?: string[] | null
          tags?: string[] | null
          title?: string | null
          video_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          channel?: string | null
          date?: string | null
          keyword?: string[] | null
          tags?: string[] | null
          title?: string | null
          video_id?: string | null
          created_at?: string
        }
      }
      watch_history_arrays: {
        Row: {
          id: string
          user_id: string
          watch_history_data: any // JSONB
          timestamp: string
          cluster_history_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          watch_history_data: any
          timestamp?: string
          cluster_history_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          watch_history_data?: any
          timestamp?: string
          cluster_history_id?: string | null
          created_at?: string
        }
      }
    }
  }
}