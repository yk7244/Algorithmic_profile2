import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type ImageRow = Database['public']['Tables']['image_data']['Row']
type ImageInsert = Database['public']['Tables']['image_data']['Insert']
type ImageUpdate = Database['public']['Tables']['image_data']['Update']

/**
 * 사용자의 모든 이미지 조회
 */
export async function getUserImages(userId: string): Promise<ImageRow[]> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user images:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserImages:', error)
    return []
  }
}

/**
 * 특정 클러스터의 이미지들 조회
 */
export async function getClusterImages(clusterId: string): Promise<ImageRow[]> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .select('*')
      .eq('cluster_id', clusterId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cluster images:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getClusterImages:', error)
    return []
  }
}

/**
 * 사용자의 현재 활성 이미지들 조회 (클러스터 ID가 없는 것들)
 */
export async function getActiveUserImages(userId: string): Promise<ImageRow[]> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .select('*')
      .eq('user_id', userId)
      .is('cluster_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active user images:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getActiveUserImages:', error)
    return []
  }
}

/**
 * 이미지 생성
 */
export async function createImage(imageData: ImageInsert): Promise<ImageRow | null> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .insert(imageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating image:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createImage:', error)
    return null
  }
}

/**
 * 여러 이미지 일괄 생성
 */
export async function createImages(imagesData: ImageInsert[]): Promise<ImageRow[]> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .insert(imagesData)
      .select()

    if (error) {
      console.error('Error creating images:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in createImages:', error)
    return []
  }
}

/**
 * 이미지 업데이트
 */
export async function updateImage(imageId: string, updates: ImageUpdate): Promise<ImageRow | null> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating image:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateImage:', error)
    return null
  }
}

/**
 * 이미지 위치 업데이트
 */
export async function updateImagePosition(imageId: string, x: number, y: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_data')
      .update({ 
        position_x: x, 
        position_y: y 
      })
      .eq('id', imageId)

    if (error) {
      console.error('Error updating image position:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateImagePosition:', error)
    return false
  }
}

/**
 * 이미지 프레임 스타일 업데이트
 */
export async function updateImageFrameStyle(imageId: string, frameStyle: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_data')
      .update({ frame_style: frameStyle })
      .eq('id', imageId)

    if (error) {
      console.error('Error updating image frame style:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateImageFrameStyle:', error)
    return false
  }
}

/**
 * 이미지 삭제
 */
export async function deleteImage(imageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_data')
      .delete()
      .eq('id', imageId)

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteImage:', error)
    return false
  }
}

/**
 * 사용자의 모든 이미지 삭제
 */
export async function deleteAllUserImages(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_data')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting all user images:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteAllUserImages:', error)
    return false
  }
}

/**
 * 공개된 사용자의 이미지들 조회 (탐색 기능용)
 */
export async function getPublicUserImages(userId: string): Promise<ImageRow[]> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('user_id', userId)
      .eq('users.open_to_connect', true)
      .is('cluster_id', null) // 현재 활성 이미지들만
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching public user images:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPublicUserImages:', error)
    return []
  }
}

/**
 * 키워드로 이미지 검색 (공개된 이미지만)
 */
export async function searchImagesByKeyword(keyword: string, limit: number = 20): Promise<ImageRow[]> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('users.open_to_connect', true)
      .or(`main_keyword.ilike.%${keyword}%,keywords.cs.{${keyword}}`)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching images by keyword:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchImagesByKeyword:', error)
    return []
  }
}

/**
 * 유사한 이미지 찾기 (카테고리 기반)
 */
export async function getSimilarImages(category: string, excludeUserId?: string, limit: number = 10): Promise<ImageRow[]> {
  try {
    let query = supabase
      .from('image_data')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('users.open_to_connect', true)
      .eq('category', category)
      .limit(limit)
      .order('similarity', { ascending: false, nullsLast: true })

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error finding similar images:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSimilarImages:', error)
    return []
  }
}

/**
 * 이미지 통계 조회
 */
export async function getImageStats(userId: string): Promise<{
  total: number
  byCategory: Record<string, number>
  byKeyword: Record<string, number>
}> {
  try {
    const images = await getUserImages(userId)
    
    const stats = {
      total: images.length,
      byCategory: {} as Record<string, number>,
      byKeyword: {} as Record<string, number>
    }

    images.forEach(image => {
      // 카테고리별 통계
      if (image.category) {
        stats.byCategory[image.category] = (stats.byCategory[image.category] || 0) + 1
      }

      // 키워드별 통계
      image.keywords.forEach(keyword => {
        stats.byKeyword[keyword] = (stats.byKeyword[keyword] || 0) + 1
      })
    })

    return stats
  } catch (error) {
    console.error('Error in getImageStats:', error)
    return { total: 0, byCategory: {}, byKeyword: {} }
  }
}