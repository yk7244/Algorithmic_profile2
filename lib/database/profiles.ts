import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * 사용자의 활성 프로필 조회
 */
export async function getActiveProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching active profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getActiveProfile:', error)
    return null
  }
}

/**
 * 사용자의 모든 프로필 조회 (히스토리)
 */
export async function getUserProfiles(userId: string): Promise<ProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user profiles:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserProfiles:', error)
    return []
  }
}

/**
 * 새 프로필 생성
 */
export async function createProfile(profileData: ProfileInsert): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createProfile:', error)
    return null
  }
}

/**
 * 새 활성 프로필 생성 (기존 활성 프로필 비활성화)
 */
export async function createActiveProfile(profileData: Omit<ProfileInsert, 'is_active'>): Promise<ProfileRow | null> {
  try {
    // 트랜잭션으로 처리
    const { data, error } = await supabase.rpc('create_active_profile', {
      p_user_id: profileData.user_id,
      p_nickname: profileData.nickname,
      p_main_description: profileData.main_description,
      p_background_color: profileData.background_color || '#ffffff'
    })

    if (error) {
      console.error('Error creating active profile:', error)
      return null
    }

    // 새로 생성된 프로필 조회
    return await getActiveProfile(profileData.user_id)
  } catch (error) {
    console.error('Error in createActiveProfile:', error)
    
    // RPC 함수가 없으면 수동으로 처리
    try {
      // 1. 기존 활성 프로필들 비활성화
      await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', profileData.user_id)
        .eq('is_active', true)

      // 2. 새 활성 프로필 생성
      return await createProfile({
        ...profileData,
        is_active: true
      })
    } catch (fallbackError) {
      console.error('Error in createActiveProfile fallback:', fallbackError)
      return null
    }
  }
}

/**
 * 프로필 업데이트
 */
export async function updateProfile(profileId: string, updates: ProfileUpdate): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateProfile:', error)
    return null
  }
}

/**
 * 활성 프로필 업데이트
 */
export async function updateActiveProfile(userId: string, updates: Omit<ProfileUpdate, 'user_id' | 'is_active'>): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()
      .single()

    if (error) {
      console.error('Error updating active profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateActiveProfile:', error)
    return null
  }
}

/**
 * 프로필 활성화 (다른 프로필들은 비활성화)
 */
export async function activateProfile(profileId: string, userId: string): Promise<boolean> {
  try {
    // 1. 모든 프로필 비활성화
    await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('user_id', userId)

    // 2. 지정된 프로필 활성화
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', profileId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error activating profile:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in activateProfile:', error)
    return false
  }
}

/**
 * 공개된 프로필 조회 (탐색 기능용)
 */
export async function getPublicProfiles(limit: number = 20): Promise<(ProfileRow & { user_email?: string })[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        users!inner(email, open_to_connect)
      `)
      .eq('is_active', true)
      .eq('users.open_to_connect', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching public profiles:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPublicProfiles:', error)
    return []
  }
}

/**
 * 특정 사용자의 공개 프로필 조회
 */
export async function getPublicUserProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('users.open_to_connect', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned or not public
        return null
      }
      console.error('Error fetching public user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getPublicUserProfile:', error)
    return null
  }
}

/**
 * 프로필 검색 (키워드 기반)
 */
export async function searchProfiles(searchTerm: string, limit: number = 10): Promise<ProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('is_active', true)
      .eq('users.open_to_connect', true)
      .or(`nickname.ilike.%${searchTerm}%,main_description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching profiles:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchProfiles:', error)
    return []
  }
}