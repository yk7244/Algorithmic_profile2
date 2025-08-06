import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

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
      .maybeSingle()

    if (error) {
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
 * 공개된 프로필 조회 (탐색 기능용)
 */
export async function getPublicProfiles(limit: number = 20): Promise<ProfileRow[]> {
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
    console.log(`🔍 getPublicUserProfile 실행: ${userId}`);
    
    // 1. 먼저 사용자가 공개 상태인지 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, nickname, open_to_connect, created_at')
      .eq('id', userId)
      .eq('open_to_connect', true)
      .single()

    if (userError) {
      console.log(`⚠️ 사용자 조회 실패 또는 비공개: ${userId}`, userError);
      return null;
    }

    if (!userData) {
      console.log(`⚠️ 사용자가 없거나 비공개: ${userId}`);
      return null;
    }

    console.log(`✅ 공개 사용자 확인: ${userData.nickname}`);

    // 2. 해당 사용자의 활성 프로필 조회
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log(`⚠️ 활성 프로필이 없음: ${userId}`);
        return null;
      }
      console.error('프로필 조회 실패:', profileError);
      return null;
    }

    // 3. 결합된 데이터 반환 (others_profile 페이지와 호환)
    const result = {
      ...profileData,
      user: userData,  // ✅ user (단수형)로 반환
      users: userData  // ✅ 기존 호환성을 위해 users도 유지
    };

    console.log(`✅ 프로필 조회 성공: ${userData.nickname}`);
    return result as ProfileRow;
    
  } catch (error) {
    console.error('❌ getPublicUserProfile 실행 중 오류:', error);
    return null;
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