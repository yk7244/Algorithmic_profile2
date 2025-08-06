import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type SliderHistoryRow = Database['public']['Tables']['slider_history']['Row']
type SliderHistoryInsert = Database['public']['Tables']['slider_history']['Insert']
type SliderHistoryUpdate = Database['public']['Tables']['slider_history']['Update']

/**
 * 사용자의 슬라이더 히스토리 조회
 */
export async function getSliderHistory(userId: string): Promise<SliderHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('slider_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching slider history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSliderHistory:', error)
    return []
  }
}

/**
 * 특정 버전 타입의 슬라이더 히스토리 조회
 */
export async function getSliderHistoryByType(
  userId: string, 
  versionType: 'upload' | 'self'
): Promise<SliderHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('slider_history')
      .select('*')
      .eq('user_id', userId)
      .eq('version_type', versionType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching slider history by type:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSliderHistoryByType:', error)
    return []
  }
}

/**
 * 최신 슬라이더 히스토리 조회
 */
export async function getLatestSliderHistory(userId: string): Promise<SliderHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('slider_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching latest slider history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getLatestSliderHistory:', error)
    return null
  }
}

/**
 * 슬라이더 히스토리 생성
 */
export async function createSliderHistory(sliderData: SliderHistoryInsert): Promise<SliderHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('slider_history')
      .insert(sliderData)
      .select()
      .single()

    if (error) {
      console.error('Error creating slider history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createSliderHistory:', error)
    return null
  }
}

/**
 * 슬라이더 히스토리 저장 (localStorage 대체)
 */
export async function saveSliderHistory(
  userId: string,
  versionType: 'upload' | 'self',
  nickname: string,
  description: string,
  backgroundColor: string,
  imagesData: any[]
): Promise<SliderHistoryRow | null> {
  try {
    const sliderData: SliderHistoryInsert = {
      user_id: userId,
      version_type: versionType,
      nickname,
      description,
      background_color: backgroundColor,
      images_data: imagesData
    }

    return await createSliderHistory(sliderData)
  } catch (error) {
    console.error('Error in saveSliderHistory:', error)
    return null
  }
}

/**
 * 무드보드 히스토리 저장 (기존 함수와 호환)
 */
export async function saveMoodboardHistory(
  userId: string,
  nickname: string,
  description: string,
  backgroundColor: string,
  imagesData: any[]
): Promise<SliderHistoryRow | null> {
  try {
    return await saveSliderHistory(
      userId,
      'self', // 무드보드는 보통 'self' 타입
      nickname,
      description,
      backgroundColor,
      imagesData
    )
  } catch (error) {
    console.error('Error in saveMoodboardHistory:', error)
    return null
  }
}

/**
 * 슬라이더 히스토리 업데이트
 */
export async function updateSliderHistory(
  sliderId: string, 
  updates: SliderHistoryUpdate
): Promise<SliderHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('slider_history')
      .update(updates)
      .eq('id', sliderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating slider history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateSliderHistory:', error)
    return null
  }
}

/**
 * 슬라이더 히스토리 삭제
 */
export async function deleteSliderHistory(sliderId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('slider_history')
      .delete()
      .eq('id', sliderId)

    if (error) {
      console.error('Error deleting slider history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteSliderHistory:', error)
    return false
  }
}

/**
 * 사용자의 모든 슬라이더 히스토리 삭제
 */
export async function deleteAllSliderHistory(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('slider_history')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting all slider history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteAllSliderHistory:', error)
    return false
  }
}

/**
 * 특정 기간의 슬라이더 히스토리 조회
 */
export async function getSliderHistoryByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<SliderHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('slider_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching slider history by date range:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSliderHistoryByDateRange:', error)
    return []
  }
}

/**
 * 슬라이더 히스토리 통계 조회
 */
export async function getSliderHistoryStats(userId: string): Promise<{
  totalCount: number;
  uploadCount: number;
  selfCount: number;
  oldestHistory: string | null;
  newestHistory: string | null;
}> {
  try {
    // 전체 개수
    const { count: totalCount } = await supabase
      .from('slider_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // upload 타입 개수
    const { count: uploadCount } = await supabase
      .from('slider_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('version_type', 'upload')

    // self 타입 개수
    const { count: selfCount } = await supabase
      .from('slider_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('version_type', 'self')

    // 가장 오래된/최신 히스토리
    const { data: oldestData } = await supabase
      .from('slider_history')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    const { data: newestData } = await supabase
      .from('slider_history')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    return {
      totalCount: totalCount || 0,
      uploadCount: uploadCount || 0,
      selfCount: selfCount || 0,
      oldestHistory: oldestData?.[0]?.created_at || null,
      newestHistory: newestData?.[0]?.created_at || null
    }
  } catch (error) {
    console.error('Error getting slider history stats:', error)
    return {
      totalCount: 0,
      uploadCount: 0,
      selfCount: 0,
      oldestHistory: null,
      newestHistory: null
    }
  }
}

/**
 * localStorage의 SliderHistory를 DB 형식으로 변환
 */
export function convertLocalStorageSliderHistoryToDB(localHistory: any[]): SliderHistoryInsert[] {
  return localHistory.map(item => ({
    user_id: '', // 호출할 때 설정
    version_type: item.version_type || item.versionType || 'self',
    nickname: item.nickname || '',
    description: item.description || item.main_description || '',
    background_color: item.background_color || item.backgroundColor || '#ffffff',
    images_data: item.images_data || item.imagesData || item.images || []
  }))
}

/**
 * DB 슬라이더 히스토리를 localStorage 형식으로 변환
 */
export function convertDBSliderHistoryToLocalStorage(dbHistory: SliderHistoryRow[]): any[] {
  return dbHistory.map(item => ({
    id: item.id,
    version_type: item.version_type,
    versionType: item.version_type, // 기존 코드 호환성
    nickname: item.nickname,
    description: item.description,
    main_description: item.description, // 기존 코드 호환성
    background_color: item.background_color,
    backgroundColor: item.background_color, // 기존 코드 호환성
    images_data: item.images_data,
    imagesData: item.images_data, // 기존 코드 호환성
    images: item.images_data, // 기존 코드 호환성
    created_at: item.created_at
  }))
}