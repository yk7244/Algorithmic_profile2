import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type VideoRow = Database['public']['Tables']['videos']['Row']
type VideoInsert = Database['public']['Tables']['videos']['Insert']
type VideoUpdate = Database['public']['Tables']['videos']['Update']

/**
 * 비디오 ID로 캐시된 비디오 정보 조회 (YouTube API 캐싱)
 */
export async function getVideoById(videoId: string): Promise<VideoRow | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle()  // ✅ .single() → .maybeSingle() 변경

    if (error) {
      console.error('Error fetching video by id:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getVideoById:', error)
    return null
  }
}

/**
 * 비디오 정보 캐시에 저장
 */
export async function createVideo(videoData: VideoInsert): Promise<VideoRow | null> {
  try {
    // ✅ ON CONFLICT를 사용한 안전한 upsert
    const { data, error } = await supabase
      .from('videos')
      .upsert(videoData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating video cache:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createVideo:', error)
    return null
  }
}

/**
 * 비디오 정보 업데이트 (캐시 갱신)
 */
export async function updateVideo(videoId: string, updates: VideoUpdate): Promise<VideoRow | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update({
        ...updates,
        last_fetched_at: new Date().toISOString()
      })
      .eq('id', videoId)
      .select()
      .single()

    if (error) {
      console.error('Error updating video cache:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateVideo:', error)
    return null
  }
}

/**
 * 비디오 정보 upsert (있으면 업데이트, 없으면 생성)
 */
export async function upsertVideo(videoData: VideoInsert): Promise<VideoRow | null> {
  try {
    // ✅ createVideo가 이제 upsert를 처리하므로 간소화
    return await createVideo(videoData)
  } catch (error) {
    console.error('Error in upsertVideo:', error)
    return null
  }
}

/**
 * 여러 비디오 정보 일괄 저장
 */
export async function createVideos(videosData: VideoInsert[]): Promise<VideoRow[]> {
  try {
    if (videosData.length === 0) {
      console.log('📝 createVideos: 저장할 데이터가 없습니다');
      return []
    }

    // ✅ 입력 데이터 중복 검사
    const uniqueIds = new Set(videosData.map(v => v.id));
    if (uniqueIds.size !== videosData.length) {
      console.error(`🚨 입력 데이터에 중복 ID 발견: ${videosData.length}개 중 ${uniqueIds.size}개 고유`);
      console.log('중복 ID들:', videosData.map(v => v.id).filter((id, index, arr) => arr.indexOf(id) !== index));
      
      // ✅ 중복 제거 후 진행
      const uniqueVideosData = Array.from(new Map(videosData.map(v => [v.id, v])).values());
      console.log(`🔄 중복 제거 후 진행: ${uniqueVideosData.length}개`);
      videosData = uniqueVideosData;
    }

    console.log(`💾 createVideos 실행: ${videosData.length}개 비디오 upsert`);

    // ✅ 배치 upsert로 중복 처리
    const { data, error } = await supabase
      .from('videos')
      .upsert(videosData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Error creating/updating videos cache:', error)
      console.error('에러 상세:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // ✅ 특정 에러 코드에 대한 추가 정보
      if (error.code === '21000') {
        console.error('🚨 PostgreSQL 중복 키 에러 - ON CONFLICT 처리 실패');
        console.log('문제가 된 데이터 샘플:', videosData.slice(0, 3));
      }
      
      return []
    }

    console.log(`✅ createVideos 성공: ${data?.length || 0}개 저장됨`);
    return data || []
  } catch (error) {
    console.error('Error in createVideos:', error)
    console.error('createVideos 예외 상세:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      dataLength: videosData?.length || 0
    })
    return []
  }
}

/**
 * 캐시된 비디오 정보 조회 (YouTube API 절약)
 */
export async function getCachedVideoInfo(videoId: string): Promise<{
  cached: boolean;
  data: VideoRow | null;
  needsRefresh: boolean;
}> {
  try {
    const cachedVideo = await getVideoById(videoId)
    
    if (!cachedVideo) {
      return {
        cached: false,
        data: null,
        needsRefresh: true
      }
    }

    // 캐시가 7일 이상 오래된 경우 새로고침 필요
    const lastFetched = new Date(cachedVideo.last_fetched_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const needsRefresh = lastFetched < sevenDaysAgo

    return {
      cached: true,
      data: cachedVideo,
      needsRefresh
    }
  } catch (error) {
    console.error('Error in getCachedVideoInfo:', error)
    return {
      cached: false,
      data: null,
      needsRefresh: true
    }
  }
}

/**
 * YouTube API 응답을 DB 형식으로 변환
 */
export function convertYouTubeResponseToVideoData(youtubeData: any): VideoInsert {
  const snippet = youtubeData.snippet || {}
  const statistics = youtubeData.statistics || {}
  
  return {
    id: youtubeData.id,
    title: snippet.title || '',
    description: snippet.description || null,
    channel_id: snippet.channelId || null,
    channel_name: snippet.channelTitle || null,
    published_at: snippet.publishedAt ? new Date(snippet.publishedAt).toISOString() : null,
    thumbnail_url: snippet.thumbnails?.maxres?.url || 
                   snippet.thumbnails?.high?.url || 
                   snippet.thumbnails?.medium?.url || 
                   snippet.thumbnails?.default?.url || null,
    view_count: statistics.viewCount ? parseInt(statistics.viewCount) : null,
    like_count: statistics.likeCount ? parseInt(statistics.likeCount) : null,
    comment_count: statistics.commentCount ? parseInt(statistics.commentCount) : null,
    url: `https://www.youtube.com/watch?v=${youtubeData.id}`,
    tags: snippet.tags || [],
    keywords: [] // AI가 나중에 추출할 키워드들
  }
}

/**
 * 비디오 키워드 업데이트 (AI 분석 후)
 */
export async function updateVideoKeywords(videoId: string, keywords: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('videos')
      .update({ 
        keywords,
        last_fetched_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (error) {
      console.error('Error updating video keywords:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateVideoKeywords:', error)
    return false
  }
}

/**
 * 채널별 비디오 조회
 */
export async function getVideosByChannel(channelId: string, limit: number = 20): Promise<VideoRow[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channelId)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching videos by channel:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getVideosByChannel:', error)
    return []
  }
}

/**
 * 키워드로 비디오 검색
 */
export async function searchVideosByKeyword(keyword: string, limit: number = 20): Promise<VideoRow[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .or(`title.ilike.%${keyword}%,keywords.cs.{${keyword}},tags.cs.{${keyword}}`)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching videos by keyword:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchVideosByKeyword:', error)
    return []
  }
}

/**
 * 오래된 비디오 캐시 정리 (90일 이상)
 */
export async function cleanupOldVideoCache(): Promise<number> {
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data, error } = await supabase
      .from('videos')
      .delete()
      .lt('last_fetched_at', ninetyDaysAgo.toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up old video cache:', error)
      return 0
    }

    const deletedCount = data?.length || 0
    console.log(`Cleaned up ${deletedCount} old video caches`)
    return deletedCount
  } catch (error) {
    console.error('Error in cleanupOldVideoCache:', error)
    return 0
  }
}

/**
 * 비디오 캐시 통계 조회
 */
export async function getVideoCacheStats(): Promise<{
  totalVideos: number;
  uniqueChannels: number;
  oldestCache: string | null;
  newestCache: string | null;
  needsRefreshCount: number;
}> {
  try {
    // 전체 비디오 수
    const { count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })

    // 고유 채널 수
    const { data: channelData } = await supabase
      .from('videos')
      .select('channel_id')
      .not('channel_id', 'is', null)

    const uniqueChannels = new Set(channelData?.map(v => v.channel_id)).size

    // 가장 오래된/최신 캐시
    const { data: oldestData } = await supabase
      .from('videos')
      .select('last_fetched_at')
      .order('last_fetched_at', { ascending: true })
      .limit(1)

    const { data: newestData } = await supabase
      .from('videos')
      .select('last_fetched_at')
      .order('last_fetched_at', { ascending: false })
      .limit(1)

    // 새로고침이 필요한 캐시 수 (7일 이상)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: needsRefreshCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .lt('last_fetched_at', sevenDaysAgo.toISOString())

    return {
      totalVideos: totalVideos || 0,
      uniqueChannels,
      oldestCache: oldestData?.[0]?.last_fetched_at || null,
      newestCache: newestData?.[0]?.last_fetched_at || null,
      needsRefreshCount: needsRefreshCount || 0
    }
  } catch (error) {
    console.error('Error getting video cache stats:', error)
    return {
      totalVideos: 0,
      uniqueChannels: 0,
      oldestCache: null,
      newestCache: null,
      needsRefreshCount: 0
    }
  }
}

/**
 * 비디오 ID 배열에서 캐시되지 않은 비디오들만 필터링
 */
export async function getUncachedVideoIds(videoIds: string[]): Promise<string[]> {
  try {
    if (videoIds.length === 0) return []

    const { data, error } = await supabase
      .from('videos')
      .select('id')
      .in('id', videoIds)

    if (error) {
      console.error('Error checking cached videos:', error)
      return videoIds // 오류 시 모든 비디오를 다시 가져오도록
    }

    const cachedIds = new Set(data?.map(v => v.id) || [])
    return videoIds.filter(id => !cachedIds.has(id))
  } catch (error) {
    console.error('Error in getUncachedVideoIds:', error)
    return videoIds
  }
}

/**
 * 여러 비디오 ID에 대한 캐시 정보 일괄 조회
 */
export async function getBulkCachedVideoInfo(videoIds: string[]): Promise<{
  cached: VideoRow[];
  uncached: string[];
  needsRefresh: VideoRow[];
}> {
  try {
    if (videoIds.length === 0) {
      return { cached: [], uncached: [], needsRefresh: [] }
    }

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .in('id', videoIds)

    if (error) {
      console.error('Error fetching bulk video cache:', error)
      return { cached: [], uncached: videoIds, needsRefresh: [] }
    }

    const cachedVideos = data || []
    const cachedIds = new Set(cachedVideos.map(v => v.id))
    const uncachedIds = videoIds.filter(id => !cachedIds.has(id))

    // 새로고침이 필요한 비디오들 (7일 이상)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const needsRefresh = cachedVideos.filter(video => {
      const lastFetched = new Date(video.last_fetched_at)
      return lastFetched < sevenDaysAgo
    })

    const upToDateCached = cachedVideos.filter(video => {
      const lastFetched = new Date(video.last_fetched_at)
      return lastFetched >= sevenDaysAgo
    })

    return {
      cached: upToDateCached,
      uncached: uncachedIds,
      needsRefresh
    }
  } catch (error) {
    console.error('Error in getBulkCachedVideoInfo:', error)
    return { cached: [], uncached: videoIds, needsRefresh: [] }
  }
}

/**
 * 여러 비디오 ID로 비디오 조회 (Foreign Key 검증용)
 */
export async function getVideosByIds(videoIds: string[]): Promise<Pick<VideoRow, 'id' | 'title'>[]> {
  try {
    if (videoIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('videos')
      .select('id, title')
      .in('id', videoIds)

    if (error) {
      console.error('Error fetching videos by IDs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getVideosByIds:', error)
    return []
  }
}