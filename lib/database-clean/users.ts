import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type UserRow = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * 사용자 정보 조회
 */
export async function getUser(userId: string): Promise<UserRow | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUser:', error)
    return null
  }
}

/**
 * 사용자 정보 생성 (회원가입 시)
 */
export async function createUser(userData: UserInsert): Promise<UserRow | null> {
  try {
    console.log('🔄 사용자 생성 시도:', userData.id, userData.email);
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error('❌ 사용자 생성 오류:', error);
      console.error('❌ 오류 세부사항:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return null
    }

    console.log('✅ 사용자 생성 성공:', data.id, data.email);
    return data
  } catch (error) {
    console.error('❌ createUser 예외 발생:', error)
    return null
  }
}

/**
 * 사용자 정보 업데이트
 */
export async function updateUser(userId: string, updates: UserUpdate): Promise<UserRow | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateUser:', error)
    return null
  }
}

/**
 * 사용자 배경색 업데이트
 */
export async function updateUserBackgroundColor(userId: string, backgroundColor: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ background_color: backgroundColor })
      .eq('id', userId)

    if (error) {
      console.error('Error updating background color:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserBackgroundColor:', error)
    return false
  }
}

/**
 * 사용자 공개 설정 토글
 */
export async function toggleUserOpenToConnect(userId: string): Promise<boolean> {
  try {
    // 현재 상태 조회
    const currentUser = await getUser(userId)
    if (!currentUser) {
      console.error('User not found')
      return false
    }

    // 상태 반전하여 업데이트
    const { error } = await supabase
      .from('users')
      .update({ open_to_connect: !currentUser.open_to_connect })
      .eq('id', userId)

    if (error) {
      console.error('Error toggling open_to_connect:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in toggleUserOpenToConnect:', error)
    return false
  }
}

/**
 * 마지막 분석 시간 업데이트
 */
export async function updateLastAnalysisTime(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_analysis_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating last analysis time:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateLastAnalysisTime:', error)
    return false
  }
}

/**
 * 공개된 사용자 목록 조회 (탐색 기능용)
 */
export async function getPublicUsers(limit: number = 20): Promise<UserRow[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('open_to_connect', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching public users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPublicUsers:', error)
    return []
  }
}

/**
 * 사용자 검색 (닉네임 기반)
 */
export async function searchUsers(searchTerm: string, limit: number = 10): Promise<UserRow[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('open_to_connect', true)
      .ilike('nickname', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchUsers:', error)
    return []
  }
}