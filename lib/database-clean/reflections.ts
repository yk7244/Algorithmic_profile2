import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type ReflectionRow = Database['public']['Tables']['reflections']['Row']
type ReflectionInsert = Database['public']['Tables']['reflections']['Insert']
type ReflectionUpdate = Database['public']['Tables']['reflections']['Update']

type ReflectionAnswerRow = Database['public']['Tables']['reflection_answers']['Row']
type ReflectionAnswerInsert = Database['public']['Tables']['reflection_answers']['Insert']

/**
 * 사용자의 리플렉션 데이터 조회
 */
export async function getReflectionData(userId: string): Promise<ReflectionRow | null> {
  try {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching reflection data:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getReflectionData:', error)
    return null
  }
}

/**
 * 리플렉션 데이터 생성
 */
export async function createReflectionData(reflectionData: ReflectionInsert): Promise<ReflectionRow | null> {
  try {
    const { data, error } = await supabase
      .from('reflections')
      .insert(reflectionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating reflection data:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createReflectionData:', error)
    return null
  }
}

/**
 * 리플렉션 데이터 업데이트
 */
export async function updateReflectionData(
  userId: string, 
  updates: ReflectionUpdate
): Promise<ReflectionRow | null> {
  try {
    const { data, error } = await supabase
      .from('reflections')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating reflection data:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateReflectionData:', error)
    return null
  }
}

/**
 * 리플렉션 1 완료 상태 설정
 */
export async function setReflection1Completed(
  userId: string, 
  answers: any
): Promise<ReflectionRow | null> {
  try {
    // 기존 데이터 확인
    let existingReflection = await getReflectionData(userId)
    
    if (!existingReflection) {
      // 새로 생성
      const newReflection: ReflectionInsert = {
        user_id: userId,
        reflection1_completed: true,
        reflection2_completed: false,
        searched: false,
        tutorial: false,
        reflection1_answers: answers, // ✅ DB 스키마 업데이트 후 사용
        reflection2_answers: null,    // ✅ DB 스키마 업데이트 후 사용
        timestamp: new Date().toISOString()
      }
      return await createReflectionData(newReflection)
    } else {
      // 기존 데이터 업데이트
      return await updateReflectionData(userId, {
        reflection1_completed: true,
        reflection1_answers: answers, // ✅ DB 스키마 업데이트 후 사용
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error in setReflection1Completed:', error)
    return null
  }
}

/**
 * 리플렉션 2 완료 상태 설정
 */
export async function setReflection2Completed(
  userId: string, 
  answers: any
): Promise<ReflectionRow | null> {
  try {
    // 기존 데이터 확인
    let existingReflection = await getReflectionData(userId)
    
    if (!existingReflection) {
      // 새로 생성 (비정상적인 경우이지만 처리)
      const newReflection: ReflectionInsert = {
        user_id: userId,
        reflection1_completed: false,
        reflection2_completed: true,
        searched: false,
        tutorial: false,
        reflection1_answers: null,     // ✅ DB 스키마 업데이트 후 사용
        reflection2_answers: answers,  // ✅ DB 스키마 업데이트 후 사용
        timestamp: new Date().toISOString()
      }
      return await createReflectionData(newReflection)
    } else {
      // 기존 데이터 업데이트
      return await updateReflectionData(userId, {
        reflection2_completed: true,
        reflection2_answers: answers,  // ✅ DB 스키마 업데이트 후 사용
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error in setReflection2Completed:', error)
    return null
  }
}

/**
 * 검색 완료 상태 설정
 */
export async function setSearchCompleted(userId: string): Promise<ReflectionRow | null> {
  try {
    let existingReflection = await getReflectionData(userId)
    
    if (!existingReflection) {
      const newReflection: ReflectionInsert = {
        user_id: userId,
        reflection1_completed: false,
        reflection2_completed: false,
        searched: true,
        tutorial: false,
        reflection1_answers: null,  // ✅ DB 스키마 업데이트 후 사용
        reflection2_answers: null,  // ✅ DB 스키마 업데이트 후 사용
        timestamp: new Date().toISOString()
      }
      return await createReflectionData(newReflection)
    } else {
      return await updateReflectionData(userId, {
        searched: true,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error in setSearchCompleted:', error)
    return null
  }
}

/**
 * 튜토리얼 완료 상태 설정
 */
export async function setTutorialCompleted(userId: string): Promise<ReflectionRow | null> {
  try {
    let existingReflection = await getReflectionData(userId)
    
    if (!existingReflection) {
      const newReflection: ReflectionInsert = {
        user_id: userId,
        reflection1_completed: false,
        reflection2_completed: false,
        searched: false,
        tutorial: true,
        reflection1_answers: null,  // ✅ DB 스키마 업데이트 후 사용
        reflection2_answers: null,  // ✅ DB 스키마 업데이트 후 사용
        timestamp: new Date().toISOString()
      }
      return await createReflectionData(newReflection)
    } else {
      return await updateReflectionData(userId, {
        tutorial: true,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error in setTutorialCompleted:', error)
    return null
  }
}

/**
 * 리플렉션 답변 히스토리 저장 (모든 답변을 누적하여 히스토리로 보관)
 */
export async function saveReflectionAnswers(
  userId: string, 
  reflectionData: any[]
): Promise<ReflectionAnswerRow | null> {
  try {
    const answerData: ReflectionAnswerInsert = {
      user_id: userId,
      reflection_data: reflectionData,
      timestamp: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('reflection_answers')
      .insert(answerData)
      .select()
      .single()

    if (error) {
      console.error('Error saving reflection answers:', error)
      return null
    }

    console.log('✅ reflection 답변이 히스토리에 추가되었습니다.');
    return data
  } catch (error) {
    console.error('Error in saveReflectionAnswers:', error)
    return null
  }
}

/**
 * 사용자의 리플렉션 답변 히스토리 조회
 */
export async function getReflectionAnswers(userId: string): Promise<ReflectionAnswerRow[]> {
  try {
    const { data, error } = await supabase
      .from('reflection_answers')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching reflection answers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getReflectionAnswers:', error)
    return []
  }
}

/**
 * 최신 리플렉션 답변 조회
 */
export async function getLatestReflectionAnswers(userId: string): Promise<ReflectionAnswerRow | null> {
  try {
    const { data, error } = await supabase
      .from('reflection_answers')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching latest reflection answers:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getLatestReflectionAnswers:', error)
    return null
  }
}

/**
 * 리플렉션 데이터 삭제
 */
export async function deleteReflectionData(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reflections')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting reflection data:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteReflectionData:', error)
    return false
  }
}

/**
 * localStorage의 reflectionData를 DB 형식으로 변환
 */
export function convertLocalStorageReflectionToDB(localReflection: any): ReflectionInsert {
  return {
    user_id: '', // 호출할 때 설정
    reflection1_completed: localReflection.reflection1 !== false,
    reflection2_completed: localReflection.reflection2 !== false,
    searched: localReflection.searched || false,
    tutorial: localReflection.tutorial || false,
    reflection1_answers: localReflection.reflection1_answers || null,  // ✅ DB 스키마 업데이트 후 사용
    reflection2_answers: localReflection.reflection2_answers || null,  // ✅ DB 스키마 업데이트 후 사용
    timestamp: localReflection.timestamp || new Date().toISOString()
  }
}

/**
 * DB 리플렉션을 localStorage 형식으로 변환
 */
export function convertDBReflectionToLocalStorage(dbReflection: ReflectionRow): any {
  return {
    reflection1: dbReflection.reflection1_completed,
    reflection2: dbReflection.reflection2_completed,
    searched: dbReflection.searched,
    tutorial: dbReflection.tutorial,  // ✅ 실제 DB 필드에 맞게 매핑
    reflection1_answers: dbReflection.reflection1_answers,  // ✅ DB 스키마 업데이트 후 사용
    reflection2_answers: dbReflection.reflection2_answers,  // ✅ DB 스키마 업데이트 후 사용
    timestamp: dbReflection.timestamp
  }
}