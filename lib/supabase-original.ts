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

// Database Types (프론트엔드 개발자의 원래 테이블 이름 사용)
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
      ProfileData: {
        Row: {
          id: string
          user_id: string
          nickname: string
          description: string
          background_color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname: string
          description: string
          background_color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          description?: string
          background_color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      WatchHistory: {
        Row: {
          id: string
          user_id: string
          videoId: string | null
          title: string
          description: string | null
          tags: string[] | null
          keywords: string[] | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          videoId?: string | null
          title: string
          description?: string | null
          tags?: string[] | null
          keywords?: string[] | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          videoId?: string | null
          title?: string
          description?: string | null
          tags?: string[] | null
          keywords?: string[] | null
          timestamp?: string
          created_at?: string
        }
      }
      ClusterHistory: {
        Row: {
          id: string
          user_id: string
          profile_id: string | null
          nickname: string
          description: string
          images: any // JSONB - ImageData[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id?: string | null
          nickname: string
          description: string
          images: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string | null
          nickname?: string
          description?: string
          images?: any
          created_at?: string
        }
      }
      ImageData: {
        Row: {
          id: string
          user_id: string | null
          cluster_id: string | null
          main_keyword: string
          keywords: string[]
          mood_keyword: string | null
          description: string | null
          category: string | null
          src: string
          width: number
          height: number
          sizeWeight: number
          position: any // JSONB - {x: number, y: number}
          rotate: number
          left: string | null  // PostgreSQL 예약어지만 따옴표로 처리
          top: string | null   // PostgreSQL 예약어지만 따옴표로 처리
          frameStyle: string
          relatedVideos: any // JSONB - {title: string, embedId: string}[]
          desired_self: boolean
          desired_self_profile: any // JSONB
          metadata: any // JSONB
          similarity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          cluster_id?: string | null
          main_keyword: string
          keywords: string[]
          mood_keyword?: string | null
          description?: string | null
          category?: string | null
          src: string
          width?: number
          height?: number
          sizeWeight?: number
          position?: any
          rotate?: number
          left?: string | null
          top?: string | null
          frameStyle?: string
          relatedVideos?: any
          desired_self?: boolean
          desired_self_profile?: any
          metadata?: any
          similarity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          cluster_id?: string | null
          main_keyword?: string
          keywords?: string[]
          mood_keyword?: string | null
          description?: string | null
          category?: string | null
          src?: string
          width?: number
          height?: number
          sizeWeight?: number
          position?: any
          rotate?: number
          left?: string | null
          top?: string | null
          frameStyle?: string
          relatedVideos?: any
          desired_self?: boolean
          desired_self_profile?: any
          metadata?: any
          similarity?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      SliderHistory: {
        Row: {
          id: string
          user_id: string
          version_type: 'upload' | 'self'
          nickname: string
          description: string
          images: any // JSONB - ImageData[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          version_type: 'upload' | 'self'
          nickname: string
          description: string
          images: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          version_type?: 'upload' | 'self'
          nickname?: string
          description?: string
          images?: any
          created_at?: string
        }
      }
      ReflectionData: {
        Row: {
          id: string
          user_id: string
          timestamp: string
          reflection1: boolean
          reflection2: boolean
          searched: boolean
          tutorial: boolean
          reflection1_answer: any | null // JSONB - {answer1, answer2, answer3}
          reflection2_answer: any | null // JSONB - {answer1, answer2}
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          timestamp?: string
          reflection1?: boolean
          reflection2?: boolean
          searched?: boolean
          tutorial?: boolean
          reflection1_answer?: any | null
          reflection2_answer?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          timestamp?: string
          reflection1?: boolean
          reflection2?: boolean
          searched?: boolean
          tutorial?: boolean
          reflection1_answer?: any | null
          reflection2_answer?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      Reflection_answer: {
        Row: {
          id: string
          user_id: string
          reflection_data: any // JSONB - ReflectionData[]
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
      ThumbnailData: {
        Row: {
          id: string
          main_keyword: string
          src: string
          search_query: string | null
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          main_keyword: string
          src: string
          search_query?: string | null
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          main_keyword?: string
          src?: string
          search_query?: string | null
          source?: string | null
          created_at?: string
        }
      }
      ParseHistory: {
        Row: {
          id: string
          user_id: string
          channel: string | null
          date: string | null
          keyword: string[] | null
          tags: string[] | null
          title: string | null
          videoId: string | null
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
          videoId?: string | null
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
          videoId?: string | null
          created_at?: string
        }
      }
      WatchHistory_array: {
        Row: {
          id: string
          user_id: string
          watchHistory: any // JSONB - WatchHistory[]
          timestamp: string
          clusterHistory_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          watchHistory: any
          timestamp?: string
          clusterHistory_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          watchHistory?: any
          timestamp?: string
          clusterHistory_id?: string | null
          created_at?: string
        }
      }
    }
  }
}