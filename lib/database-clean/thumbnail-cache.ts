import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type ThumbnailCacheRow = Database['public']['Tables']['thumbnail_cache']['Row']
type ThumbnailCacheInsert = Database['public']['Tables']['thumbnail_cache']['Insert']
type ThumbnailCacheUpdate = Database['public']['Tables']['thumbnail_cache']['Update']

/**
 * 키워드로 썸네일 캐시 조회
 */
export async function getThumbnailByKeyword(mainKeyword: string): Promise<ThumbnailCacheRow[]> {
  try {
    const { data, error } = await supabase
      .from('thumbnail_cache')
      .select('*')
      .eq('main_keyword', mainKeyword)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching thumbnail by keyword:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getThumbnailByKeyword:', error)
    return []
  }
}

/**
 * 검색 쿼리로 썸네일 캐시 조회
 */
export async function getThumbnailByQuery(
  mainKeyword: string, 
  searchQuery: string
): Promise<ThumbnailCacheRow | null> {
  try {
    const { data, error } = await supabase
      .from('thumbnail_cache')
      .select('*')
      .eq('main_keyword', mainKeyword)
      .eq('search_query', searchQuery)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching thumbnail by query:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getThumbnailByQuery:', error)
    return null
  }
}

/**
 * 썸네일 캐시 생성
 */
export async function createThumbnailCache(thumbnailData: ThumbnailCacheInsert): Promise<ThumbnailCacheRow | null> {
  try {
    const { data, error } = await supabase
      .from('thumbnail_cache')
      .insert(thumbnailData)
      .select()
      .single()

    if (error) {
      console.error('Error creating thumbnail cache:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createThumbnailCache:', error)
    return null
  }
}

/**
 * 여러 썸네일 캐시 일괄 생성
 */
export async function createThumbnailCaches(thumbnailData: ThumbnailCacheInsert[]): Promise<ThumbnailCacheRow[]> {
  try {
    const { data, error } = await supabase
      .from('thumbnail_cache')
      .insert(thumbnailData)
      .select()

    if (error) {
      console.error('Error creating thumbnail caches:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in createThumbnailCaches:', error)
    return []
  }
}

/**
 * 썸네일 캐시 저장 (localStorage 대체)
 */
export async function saveThumbnail(
  mainKeyword: string, 
  imageUrl: string, 
  searchQuery?: string,
  source?: string
): Promise<ThumbnailCacheRow | null> {
  try {
    // 기존 캐시 확인
    const existing = searchQuery 
      ? await getThumbnailByQuery(mainKeyword, searchQuery)
      : null

    if (existing) {
      // 이미 캐시된 데이터가 있으면 업데이트
      return await updateThumbnailCache(existing.id, {
        image_url: imageUrl,
        source: source || existing.source
      })
    }

    // 새로운 캐시 생성
    const thumbnailData: ThumbnailCacheInsert = {
      main_keyword: mainKeyword,
      image_url: imageUrl,
      search_query: searchQuery || null,
      source: source || null
    }

    return await createThumbnailCache(thumbnailData)
  } catch (error) {
    console.error('Error in saveThumbnail:', error)
    return null
  }
}

/**
 * 썸네일 캐시 업데이트
 */
export async function updateThumbnailCache(
  thumbnailId: string, 
  updates: ThumbnailCacheUpdate
): Promise<ThumbnailCacheRow | null> {
  try {
    const { data, error } = await supabase
      .from('thumbnail_cache')
      .update(updates)
      .eq('id', thumbnailId)
      .select()
      .single()

    if (error) {
      console.error('Error updating thumbnail cache:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateThumbnailCache:', error)
    return null
  }
}

/**
 * 썸네일 캐시 삭제
 */
export async function deleteThumbnailCache(thumbnailId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('thumbnail_cache')
      .delete()
      .eq('id', thumbnailId)

    if (error) {
      console.error('Error deleting thumbnail cache:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteThumbnailCache:', error)
    return false
  }
}

/**
 * 오래된 썸네일 캐시 정리 (30일 이상)
 */
export async function cleanupOldThumbnails(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('thumbnail_cache')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up old thumbnails:', error)
      return 0
    }

    const deletedCount = data?.length || 0
    console.log(`Cleaned up ${deletedCount} old thumbnail caches`)
    return deletedCount
  } catch (error) {
    console.error('Error in cleanupOldThumbnails:', error)
    return 0
  }
}

/**
 * 모든 썸네일 캐시 조회 (관리자용)
 */
export async function getAllThumbnailCaches(limit: number = 100): Promise<ThumbnailCacheRow[]> {
  try {
    const { data, error } = await supabase
      .from('thumbnail_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching all thumbnail caches:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllThumbnailCaches:', error)
    return []
  }
}

/**
 * 소스별 썸네일 캐시 조회
 */
export async function getThumbnailsBySource(source: string): Promise<ThumbnailCacheRow[]> {
  try {
    const { data, error } = await supabase
      .from('thumbnail_cache')
      .select('*')
      .eq('source', source)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching thumbnails by source:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getThumbnailsBySource:', error)
    return []
  }
}

/**
 * localStorage의 thumbnailData를 DB 형식으로 변환
 */
export function convertLocalStorageThumbnailToDB(localThumbnail: any): ThumbnailCacheInsert[] {
  // localStorage의 thumbnailData는 보통 객체 형태
  // {keyword1: {imageUrl: "...", source: "..."}, keyword2: {...}}
  const thumbnails: ThumbnailCacheInsert[] = []
  
  if (typeof localThumbnail === 'object' && localThumbnail !== null) {
    Object.entries(localThumbnail).forEach(([keyword, data]: [string, any]) => {
      if (data && typeof data === 'object') {
        thumbnails.push({
          main_keyword: keyword,
          image_url: data.imageUrl || data.image_url || '',
          search_query: data.searchQuery || data.search_query || null,
          source: data.source || null
        })
      }
    })
  }
  
  return thumbnails
}

/**
 * 캐시 통계 조회
 */
export async function getThumbnailCacheStats(): Promise<{
  totalCount: number;
  sourceBreakdown: Record<string, number>;
  oldestCache: string | null;
  newestCache: string | null;
}> {
  try {
    // 전체 개수
    const { count } = await supabase
      .from('thumbnail_cache')
      .select('*', { count: 'exact', head: true })

    // 소스별 통계
    const { data: sourceData } = await supabase
      .from('thumbnail_cache')
      .select('source')
      .not('source', 'is', null)

    const sourceBreakdown: Record<string, number> = {}
    sourceData?.forEach(item => {
      if (item.source) {
        sourceBreakdown[item.source] = (sourceBreakdown[item.source] || 0) + 1
      }
    })

    // 가장 오래된/최신 캐시
    const { data: oldestData } = await supabase
      .from('thumbnail_cache')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)

    const { data: newestData } = await supabase
      .from('thumbnail_cache')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    return {
      totalCount: count || 0,
      sourceBreakdown,
      oldestCache: oldestData?.[0]?.created_at || null,
      newestCache: newestData?.[0]?.created_at || null
    }
  } catch (error) {
    console.error('Error getting thumbnail cache stats:', error)
    return {
      totalCount: 0,
      sourceBreakdown: {},
      oldestCache: null,
      newestCache: null
    }
  }
}