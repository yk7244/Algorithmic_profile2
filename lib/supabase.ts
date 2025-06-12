import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  console.error('📝 .env.local 파일에 환경변수를 추가해주세요.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// 환경변수 설정 여부 확인용 플래그
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// 타입 정의
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      profile_data: {
        Row: {
          id: string
          nickname: string
          description: string
          created_at: string
          updated_at: string
          profile_image?: string
          open_to_connect?: boolean
        }
        Insert: {
          id?: string
          nickname: string
          description: string
          created_at?: string
          updated_at?: string
          profile_image?: string
          open_to_connect?: boolean
        }
        Update: {
          id?: string
          nickname?: string
          description?: string
          created_at?: string
          updated_at?: string
          profile_image?: string
          open_to_connect?: boolean
        }
      }
    }
  }
} 