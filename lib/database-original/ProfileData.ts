import { supabase } from '@/lib/supabase-original'
import type { Database } from '@/lib/supabase-original'

type ProfileRow = Database['public']['Tables']['ProfileData']['Row']
type ProfileInsert = Database['public']['Tables']['ProfileData']['Insert']
type ProfileUpdate = Database['public']['Tables']['ProfileData']['Update']

/**
 * 사용자의 활성 프로필 조회
 */
export async function getActiveProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('ProfileData')
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
      .from('ProfileData')
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
      .from('ProfileData')
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
    // 1. 기존 활성 프로필들 비활성화
    await supabase
      .from('ProfileData')
      .update({ is_active: false })
      .eq('user_id', profileData.user_id)
      .eq('is_active', true)

    // 2. 새 활성 프로필 생성
    return await createProfile({
      ...profileData,
      is_active: true
    })
  } catch (error) {
    console.error('Error in createActiveProfile:', error)
    return null
  }
}

/**
 * 프로필 업데이트
 */
export async function updateProfile(profileId: string, updates: ProfileUpdate): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('ProfileData')
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
      .from('ProfileData')
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
 * 공개된 프로필 조회 (탐색 기능용)
 */
export async function getPublicProfiles(limit: number = 20): Promise<ProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from('ProfileData')
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
      .from('ProfileData')
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