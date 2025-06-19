import { supabase } from './supabase';
import { 
  UserData, 
  WatchHistory, 
  ClusterHistory, 
  ImageData, 
  ProfileData, 
  SliderHistory,
  ExploreWatchHistory
} from '@/app/types/profile';

// ==================== Users ====================
export const createUser = async (userData: Omit<UserData, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// ==================== Watch History ====================
export const saveWatchHistory = async (watchHistoryItems: Omit<WatchHistory, 'id'>[]) => {
  const { data, error } = await supabase
    .from('watch_history')
    .insert(watchHistoryItems.map(item => ({
      user_id: item.user_id,
      video_id: item.videoId,
      title: item.title,
      description: item.description,
      tags: item.tags || [],
      keywords: item.keywords || [],
      source: item.source || 'upload',
      timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString()
    })))
    .select();

  if (error) throw error;
  return data;
};

// 개별 WatchHistory 항목 저장
export const saveWatchHistoryItem = async (watchHistoryItem: Omit<WatchHistory, 'id'>) => {
  const { data, error } = await supabase
    .from('watch_history')
    .insert({
      user_id: watchHistoryItem.user_id,
      video_id: watchHistoryItem.videoId,
      title: watchHistoryItem.title,
      description: watchHistoryItem.description,
      tags: watchHistoryItem.tags || [],
      keywords: watchHistoryItem.keywords || [],
      source: watchHistoryItem.source || 'upload',
      timestamp: watchHistoryItem.timestamp ? new Date(watchHistoryItem.timestamp).toISOString() : new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getWatchHistory = async (userId: string, limit?: number, source?: 'upload' | 'explore') => {
  let query = supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', userId);

  // ✅ source 필터링 다시 활성화
  if (source) {
    query = query.eq('source', source);
  }

  query = query.order('timestamp', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ==================== Explore Watch History (사이트 내 둘러보기 시청 기록) ====================
export const saveExploreWatchHistory = async (exploreWatchItems: Omit<ExploreWatchHistory, 'id'>[]) => {
  const { data, error } = await supabase
    .from('explore_watch_history')
    .insert(exploreWatchItems.map(item => ({
      user_id: item.user_id,
      video_id: item.videoId,
      title: item.title,
      description: item.description,
      timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString()
    })))
    .select();

  if (error) throw error;
  return data;
};

// 개별 ExploreWatchHistory 항목 저장
export const saveExploreWatchHistoryItem = async (exploreWatchItem: Omit<ExploreWatchHistory, 'id'>) => {
  const { data, error } = await supabase
    .from('explore_watch_history')
    .insert({
      user_id: exploreWatchItem.user_id,
      video_id: exploreWatchItem.videoId,
      title: exploreWatchItem.title,
      description: exploreWatchItem.description,
      timestamp: exploreWatchItem.timestamp ? new Date(exploreWatchItem.timestamp).toISOString() : new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getExploreWatchHistory = async (userId: string, limit?: number) => {
  let query = supabase
    .from('explore_watch_history')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ==================== Cluster History ====================
export const saveClusterHistory = async (clusterData: Omit<ClusterHistory, 'id'>[]) => {
  const { data, error } = await supabase
    .from('cluster_history')
    .insert(clusterData.map(item => ({
      user_id: item.user_id,
      main_keyword: item.main_keyword,
      keywords: item.keywords || [],
      mood_keyword: item.mood_keyword,
      description: item.description,
      category: item.category,
      size_weight: item.sizeWeight,
      src: item.src,
      related_videos: item.relatedVideos,
      desired_self: item.desired_self,
      desired_self_profile: item.desired_self_profile,
      metadata: item.metadata,
      rotate: item.rotate,
      width: item.width,
      height: item.height,
      left_position: item.left,
      top_position: item.top,
      position_x: item.position.x,
      position_y: item.position.y,
      frame_style: item.frameStyle
    })))
    .select();

  if (error) throw error;
  return data;
};

export const getClusterHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('cluster_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// 🆕 공개 프로필용 클러스터 히스토리 가져오기 (RLS 우회)
export const getPublicClusterHistory = async (userId: string) => {
  // 1단계: 해당 사용자가 공개 프로필인지 확인
  const { data: profileData, error: profileError } = await supabase
    .from('profile_data')
    .select('open_to_connect')
    .eq('user_id', userId)
    .eq('open_to_connect', true)
    .single();

  if (profileError || !profileData) {
    return [];
  }

  // 2단계: 가장 최신 저장 시점 찾기
  const { data: latestHistory, error: latestError } = await supabase
    .from('cluster_history')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (latestError || !latestHistory) {
    return [];
  }

  // 3단계: 해당 시점의 모든 클러스터 가져오기 (같은 created_at)
  const latestDate = new Date(latestHistory.created_at);
  const startOfMinute = new Date(latestDate.getTime() - (latestDate.getSeconds() * 1000) - (latestDate.getMilliseconds()));
  const endOfMinute = new Date(startOfMinute.getTime() + 60000); // 1분 범위

  const { data, error } = await supabase
    .from('cluster_history')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMinute.toISOString())
    .lt('created_at', endOfMinute.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[getPublicClusterHistory] 클러스터 히스토리 조회 실패:`, error);
    return [];
  }
  
  console.log(`[getPublicClusterHistory] 사용자 ${userId}의 최신 클러스터 세트 ${data?.length || 0}개 조회 완료`);
  return data || [];
};

// ==================== Cluster Images (Profile Images) ====================
export const saveClusterImages = async (imageData: Omit<ImageData, 'id'>[]) => {
  const { data, error } = await supabase
    .from('cluster_images')
    .insert(imageData.map(item => ({
      user_id: item.user_id,
      main_keyword: item.main_keyword,
      keywords: item.keywords || [],
      mood_keyword: item.mood_keyword,
      description: item.description,
      category: item.category,
      size_weight: item.sizeWeight,
      src: item.src,
      related_videos: item.relatedVideos,
      desired_self: item.desired_self,
      desired_self_profile: item.desired_self_profile,
      metadata: item.metadata,
      rotate: item.rotate,
      width: item.width,
      height: item.height,
      left_position: item.left,
      top_position: item.top,
      position_x: item.position.x,
      position_y: item.position.y,
      frame_style: item.frameStyle
    })))
    .select();

  if (error) throw error;
  return data;
};

export const getClusterImages = async (userId: string) => {
  const { data, error } = await supabase
    .from('cluster_images')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

// 🆕 공개 프로필용 클러스터 이미지 가져오기 (RLS 우회)  
export const getPublicClusterImages = async (userId: string) => {
  // 1단계: 해당 사용자가 공개 프로필인지 확인
  const { data: profileData, error: profileError } = await supabase
    .from('profile_data')
    .select('open_to_connect')
    .eq('user_id', userId)
    .eq('open_to_connect', true)
    .single();

  if (profileError || !profileData) {
    return [];
  }

  // 2단계: 공개 프로필이 확인되면 클러스터 이미지 가져오기
  const { data, error } = await supabase
    .from('cluster_images')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error(`[getPublicClusterImages] 클러스터 이미지 조회 실패:`, error);
    return [];
  }

  return data || [];
};

export const updateClusterImages = async (userId: string, imageData: Omit<ImageData, 'id'>[]) => {
  console.log(`[updateClusterImages] 사용자 ${userId}의 클러스터 이미지 교체 시작:`, imageData.length);
  
  try {
    // 🆕 1단계: 기존 데이터 완전 삭제 (사용자별)
    const { error: deleteError } = await supabase
      .from('cluster_images')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[updateClusterImages] 기존 데이터 삭제 실패:', deleteError);
      throw deleteError;
    }
    
    console.log(`[updateClusterImages] ✅ 사용자 ${userId}의 기존 클러스터 이미지 삭제 완료`);

    // 🆕 2단계: 새 데이터가 있을 때만 삽입
    if (imageData && imageData.length > 0) {
      const newData = await saveClusterImages(imageData);
      console.log(`[updateClusterImages] ✅ 사용자 ${userId}의 새 클러스터 이미지 저장 완료:`, newData.length);
      return newData;
    } else {
      console.log(`[updateClusterImages] ⚠️ 저장할 이미지 데이터가 없음`);
      return [];
    }
    
  } catch (error) {
    console.error('[updateClusterImages] 클러스터 이미지 교체 실패:', error);
    throw error;
  }
};

// ==================== Profile Data ====================
export const saveProfileData = async (userId: string, profileData: Omit<ProfileData, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('profile_data')
    .upsert({
      user_id: userId,
      nickname: profileData.nickname,
      description: profileData.description,
      profile_image: profileData.profileImage,
      open_to_connect: profileData.open_to_connect,
      bg_color: profileData.bg_color,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProfileData = async (userId: string) => {
  const { data, error } = await supabase
    .from('profile_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows found
  return data;
};

export const getAllPublicProfiles = async () => {
  const { data, error } = await supabase
    .from('profile_data')
    .select('*')
    .eq('open_to_connect', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};

// ==================== User Settings ====================
export const saveUserSetting = async (userId: string, key: string, value: string) => {
  const { data, error } = await supabase
    .from('profile_data')
    .upsert({
      user_id: userId,
      [key]: value,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserSetting = async (userId: string, key: string) => {
  const { data, error } = await supabase
    .from('profile_data')
    .select(key)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.[key as keyof typeof data];
};

// ==================== User Settings (bg_color 전용) ====================
export const saveBgColor = async (userId: string, bgColor: string) => {
  const { data, error } = await supabase
    .from('profile_data')
    .upsert({
      user_id: userId,
      bg_color: bgColor,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBgColor = async (userId: string) => {
  const { data, error } = await supabase
    .from('profile_data')
    .select('bg_color')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.bg_color;
};

// ==================== Slider History ====================
export const saveSliderHistory = async (sliderData: Omit<SliderHistory, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('slider_history')
    .insert({
      user_id: sliderData.user_id,
      version_type: sliderData.version_type,
      nickname: sliderData.nickname,
      description: sliderData.description,
      images: sliderData.images
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSliderHistory = async (userId: string, versionType?: 'upload' | 'self') => {
  let query = supabase
    .from('slider_history')
    .select('*')
    .eq('user_id', userId);

  // version_type 필터링 추가
  if (versionType) {
    query = query.eq('version_type', versionType);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// SliderHistory 삭제 함수
export const deleteSliderHistory = async (historyId: string) => {
  const { data, error } = await supabase
    .from('slider_history')
    .delete()
    .eq('id', historyId);

  if (error) throw error;
  return data;
};

// ==================== 유틸리티 함수 ====================
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentUserId = async () => {
  const user = await getCurrentUser();
  return user?.id;
};

// 사용자가 users 테이블에 존재하는지 확인하고, 없으면 생성
export const ensureUserExists = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // users 테이블에서 사용자 조회 (RLS 정책을 우회하기 위해 다른 방법 시도)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // single() 대신 maybeSingle() 사용

    // 사용자가 존재하면 반환
    if (existingUser) {
      console.log('기존 사용자 확인:', existingUser);
      return existingUser;
    }

    // 사용자가 없으면 생성 시도
    if (!existingUser) {
      console.log('사용자가 users 테이블에 없음. 생성 중...');
      
      // 방법 1: 직접 INSERT 시도
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (createError) {
        console.error('직접 사용자 생성 실패:', createError);
        
        // 방법 2: RPC 함수 호출 시도 (만약 있다면)
        // 또는 사용자에게 다시 로그인하도록 요청
        throw new Error(`사용자 레코드 생성 실패. 로그아웃 후 다시 로그인해주세요. (${createError.message})`);
      }

      console.log('사용자 생성 완료:', newUser);
      return newUser;
    }

    // fetch 에러가 있으면 throw
    if (fetchError) {
      throw fetchError;
    }

    return existingUser;
  } catch (error) {
    console.error('ensureUserExists 실패:', error);
    throw error;
  }
};

// ==================== Videos Cache System ====================

interface VideoCache {
  id: string;
  title: string;
  description: string;
  channel_id: string;
  published_at: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  last_fetched_at: string;
  channel_name: string;
  url: string;
  tags: string[];
  keywords: string[];
}

// 캐시에서 비디오 정보 조회
export const getCachedVideo = async (videoId: string): Promise<VideoCache | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터 없음 - 정상적인 경우
        return null;
      }
      throw error;
    }

    console.log(`[getCachedVideo] 캐시에서 비디오 발견: ${videoId}`);
    return data;
  } catch (error) {
    console.error(`[getCachedVideo] 캐시 조회 실패 (${videoId}):`, error);
    return null;
  }
};

// 캐시가 만료되었는지 확인 (기본 7일)
export const isCacheExpired = (lastFetchedAt: string, maxAgeInDays: number = 7): boolean => {
  const lastFetched = new Date(lastFetchedAt);
  const now = new Date();
  const diffInDays = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60 * 24);
  
  return diffInDays > maxAgeInDays;
};

// 비디오 정보를 캐시에 저장/업데이트
export const saveVideoCache = async (videoData: Omit<VideoCache, 'last_fetched_at'>): Promise<VideoCache | null> => {
  try {
    const cacheData = {
      ...videoData,
      last_fetched_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('videos')
      .upsert(cacheData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[saveVideoCache] 비디오 캐시 저장 완료: ${videoData.id}`);
    return data;
  } catch (error) {
    console.error(`[saveVideoCache] 캐시 저장 실패 (${videoData.id}):`, error);
    return null;
  }
};

// 여러 비디오의 캐시 상태 확인
export const checkMultipleVideosCache = async (videoIds: string[]): Promise<{
  cached: VideoCache[];
  missing: string[];
  expired: VideoCache[];
}> => {
  try {
    const { data: cachedVideos, error } = await supabase
      .from('videos')
      .select('*')
      .in('id', videoIds);

    if (error) throw error;

    const cached: VideoCache[] = [];
    const expired: VideoCache[] = [];
    const foundIds = new Set<string>();

    (cachedVideos || []).forEach(video => {
      foundIds.add(video.id);
      
      if (isCacheExpired(video.last_fetched_at)) {
        expired.push(video);
      } else {
        cached.push(video);
      }
    });

    const missing = videoIds.filter(id => !foundIds.has(id));

    console.log(`[checkMultipleVideosCache] 캐시 상태 분석:`, {
      '요청': videoIds.length,
      '캐시됨': cached.length,
      '누락': missing.length,
      '만료': expired.length
    });

    return { cached, missing, expired };
  } catch (error) {
    console.error('[checkMultipleVideosCache] 캐시 상태 확인 실패:', error);
    return {
      cached: [],
      missing: videoIds,
      expired: []
    };
  }
};

// 캐시 통계 조회
export const getCacheStats = async (): Promise<{
  total: number;
  recent: number;
  expired: number;
}> => {
  try {
    const { data: allVideos, error } = await supabase
      .from('videos')
      .select('last_fetched_at');

    if (error) throw error;

    const now = new Date();
    const total = allVideos?.length || 0;
    let recent = 0;
    let expired = 0;

    (allVideos || []).forEach(video => {
      if (isCacheExpired(video.last_fetched_at)) {
        expired++;
      } else {
        recent++;
      }
    });

    return { total, recent, expired };
  } catch (error) {
    console.error('[getCacheStats] 캐시 통계 조회 실패:', error);
    return { total: 0, recent: 0, expired: 0 };
  }
};

// 만료된 캐시 정리
export const cleanExpiredCache = async (maxAgeInDays: number = 30): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

    const { data, error } = await supabase
      .from('videos')
      .delete()
      .lt('last_fetched_at', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;

    const deletedCount = data?.length || 0;
    console.log(`[cleanExpiredCache] ${deletedCount}개의 만료된 캐시 삭제 완료`);
    
    return deletedCount;
  } catch (error) {
    console.error('[cleanExpiredCache] 만료된 캐시 정리 실패:', error);
    return 0;
  }
};

// 🆕 대량 비디오 캐시 확인 및 분석 함수
export const batchCheckVideoCache = async (videoIds: string[]): Promise<{
  cacheHit: string[];
  cacheMiss: string[];
  cacheExpired: string[];
  hitRate: number;
}> => {
  if (!videoIds.length) {
    return { cacheHit: [], cacheMiss: [], cacheExpired: [], hitRate: 0 };
  }

  try {
    const { cached, missing, expired } = await checkMultipleVideosCache(videoIds);
    
    const cacheHit = cached.map(v => v.id);
    const cacheMiss = missing;
    const cacheExpired = expired.map(v => v.id);
    const hitRate = (cacheHit.length / videoIds.length) * 100;

    console.log(`[batchCheckVideoCache] 캐시 분석 완료:`, {
      '총 요청': videoIds.length,
      '캐시 히트': cacheHit.length,
      '캐시 미스': cacheMiss.length,
      '캐시 만료': cacheExpired.length,
      '히트율': `${hitRate.toFixed(1)}%`
    });

    return { cacheHit, cacheMiss, cacheExpired, hitRate };
  } catch (error) {
    console.error('[batchCheckVideoCache] 배치 캐시 확인 실패:', error);
    return { cacheHit: [], cacheMiss: videoIds, cacheExpired: [], hitRate: 0 };
  }
};

// 🆕 캐시 프리워밍 (사전 캐싱) 함수
export const prefetchVideos = async (videoIds: string[]): Promise<{
  success: string[];
  failed: string[];
}> => {
  const success: string[] = [];
  const failed: string[] = [];

  console.log(`[prefetchVideos] ${videoIds.length}개 비디오 사전 캐싱 시작`);

  // 현재 캐시 상태 확인
  const { cacheMiss, cacheExpired } = await batchCheckVideoCache(videoIds);
  const videosToFetch = [...cacheMiss, ...cacheExpired];

  if (videosToFetch.length === 0) {
    console.log('[prefetchVideos] 모든 비디오가 이미 캐시됨');
    return { success: videoIds, failed: [] };
  }

  // YouTube API에서 여러 비디오 한 번에 가져오기 (최대 50개)
  const chunkSize = 50;
  for (let i = 0; i < videosToFetch.length; i += chunkSize) {
    const chunk = videosToFetch.slice(i, i + chunkSize);
    
    try {
      const videoIdsParam = chunk.join(',');
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIdsParam}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
      );

      if (!response.ok) {
        console.error(`YouTube API 오류: ${response.status}`);
        failed.push(...chunk);
        continue;
      }

      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          try {
            const cacheData = {
              id: item.id,
              title: item.snippet.title || '',
              description: item.snippet.description || '',
              channel_id: item.snippet.channelId || '',
              published_at: item.snippet.publishedAt || new Date().toISOString(),
              thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
              view_count: 0,
              like_count: 0,
              comment_count: 0,
              channel_name: item.snippet.channelTitle || '',
              url: `https://www.youtube.com/watch?v=${item.id}`,
              tags: item.snippet.tags || [],
              keywords: [] // 프리페치에서는 키워드 생성 생략
            };

            await saveVideoCache(cacheData);
            success.push(item.id);
          } catch (saveError) {
            console.error(`비디오 ${item.id} 캐시 저장 실패:`, saveError);
            failed.push(item.id);
          }
        }
      }

      // API 레이트 리밋 방지를 위한 지연
      if (i + chunkSize < videosToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`청크 ${i}-${i + chunkSize} 처리 실패:`, error);
      failed.push(...chunk);
    }
  }

  console.log(`[prefetchVideos] 완료: 성공 ${success.length}개, 실패 ${failed.length}개`);
  return { success, failed };
};

// 🆕 캐시 워밍업 상태 확인
export const getCacheWarmupStatus = async (videoIds: string[]): Promise<{
  total: number;
  cached: number;
  missing: number;
  expired: number;
  percentage: number;
}> => {
  const { cacheHit, cacheMiss, cacheExpired } = await batchCheckVideoCache(videoIds);
  
  const total = videoIds.length;
  const cached = cacheHit.length;
  const missing = cacheMiss.length;
  const expired = cacheExpired.length;
  const percentage = total > 0 ? (cached / total) * 100 : 0;

  return { total, cached, missing, expired, percentage };
};

// 🔧 잘못된 SliderHistory 수정 함수
export const fixCorruptedSliderHistory = async () => {
  const { data: userResponse } = await supabase.auth.getUser();
  if (!userResponse.user) {
    throw new Error('로그인이 필요합니다');
  }

  const userId = userResponse.user.id;
  console.log('🔧 [fixCorruptedSliderHistory] 사용자 ID:', userId);

  try {
    // 1️⃣ 모든 SliderHistory 조회
    const { data: allHistory, error: fetchError } = await supabase
      .from('slider_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ SliderHistory 조회 실패:', fetchError);
      throw fetchError;
    }

    console.log('📊 [fixCorruptedSliderHistory] 전체 SliderHistory:', {
      '전체 개수': allHistory?.length || 0,
      '데이터': allHistory
    });

    if (!allHistory || allHistory.length === 0) {
      console.log('✅ SliderHistory가 없어 수정할 데이터가 없습니다.');
      return { message: 'SliderHistory가 없음', deleted: 0, kept: 0 };
    }

    // 2️⃣ 원시 클러스터 데이터 vs 올바른 ImageData 구분
    const corruptedData = [];
    const validData = [];

    for (const history of allHistory) {
      if (!history.image_data || !Array.isArray(history.image_data)) {
        console.warn('⚠️ image_data가 배열이 아님:', history.id);
        corruptedData.push(history);
        continue;
      }

      const firstImage = history.image_data[0];
      
      // 원시 클러스터 데이터인지 확인 (main_keyword가 있고 id/src가 없음)
      if (firstImage && firstImage.main_keyword && !firstImage.id && !firstImage.src) {
        console.log('🗑️ 원시 클러스터 데이터 발견:', {
          'history_id': history.id,
          'version_type': history.version_type,
          'created_at': history.created_at,
          'image_count': history.image_data.length,
          'first_image': firstImage
        });
        corruptedData.push(history);
      } 
      // 올바른 ImageData인지 확인 (id, src, position이 있음)
      else if (firstImage && firstImage.id && firstImage.src && firstImage.position) {
        console.log('✅ 올바른 ImageData 발견:', {
          'history_id': history.id,
          'version_type': history.version_type,
          'created_at': history.created_at,
          'image_count': history.image_data.length
        });
        validData.push(history);
      } 
      // 알 수 없는 형식
      else {
        console.warn('❓ 알 수 없는 형식:', {
          'history_id': history.id,
          'first_image': firstImage
        });
        corruptedData.push(history);
      }
    }

    console.log('📊 [fixCorruptedSliderHistory] 분류 결과:', {
      '손상된 데이터': corruptedData.length,
      '올바른 데이터': validData.length
    });

    // 3️⃣ 손상된 데이터만 삭제
    let deletedCount = 0;
    if (corruptedData.length > 0) {
      const corruptedIds = corruptedData.map(item => item.id);
      
      const { data: deleteResult, error: deleteError } = await supabase
        .from('slider_history')
        .delete()
        .in('id', corruptedIds);

      if (deleteError) {
        console.error('❌ 손상된 데이터 삭제 실패:', deleteError);
        throw deleteError;
      }

      deletedCount = corruptedIds.length;
      console.log(`🗑️ 손상된 SliderHistory ${deletedCount}개 삭제 완료`);
    }

    const result = {
      message: 'SliderHistory 수정 완료',
      deleted: deletedCount,
      kept: validData.length,
      details: {
        deletedData: corruptedData.map(item => ({
          id: item.id,
          version_type: item.version_type,
          created_at: item.created_at,
          image_count: item.image_data?.length || 0
        })),
        validData: validData.map(item => ({
          id: item.id,
          version_type: item.version_type,
          created_at: item.created_at,
          image_count: item.image_data?.length || 0
        }))
      }
    };

    console.log('✅ [fixCorruptedSliderHistory] 수정 완료:', result);
    return result;

  } catch (error) {
    console.error('❌ [fixCorruptedSliderHistory] 실패:', error);
    throw error;
  }
};

// 🧹 중복된 SliderHistory 정리 함수
export const removeDuplicateSliderHistory = async () => {
  const { data: userResponse } = await supabase.auth.getUser();
  if (!userResponse.user) {
    throw new Error('로그인이 필요합니다');
  }

  const userId = userResponse.user.id;
  console.log('🧹 [removeDuplicateSliderHistory] 사용자 ID:', userId);

  try {
    // 1️⃣ 모든 SliderHistory 조회 (최신순)
    const { data: allHistory, error: fetchError } = await supabase
      .from('slider_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ SliderHistory 조회 실패:', fetchError);
      throw fetchError;
    }

    console.log('📊 [removeDuplicateSliderHistory] 전체 SliderHistory:', {
      '전체 개수': allHistory?.length || 0,
      '데이터': allHistory
    });

    if (!allHistory || allHistory.length <= 1) {
      console.log('✅ 중복 제거할 SliderHistory가 없습니다.');
      return { message: '중복 없음', deleted: 0, kept: allHistory?.length || 0 };
    }

    // 2️⃣ version_type별로 그룹화
    const groupedByType: { [key: string]: any[] } = {};
    allHistory.forEach(history => {
      const versionType = history.version_type || 'unknown';
      if (!groupedByType[versionType]) {
        groupedByType[versionType] = [];
      }
      groupedByType[versionType].push(history);
    });

    console.log('📊 [removeDuplicateSliderHistory] 타입별 그룹화:', 
      Object.keys(groupedByType).map(type => ({
        type,
        count: groupedByType[type].length
      }))
    );

    // 3️⃣ 각 타입별로 최신 것만 남기고 나머지 삭제
    const toDelete = [];
    const toKeep = [];

    for (const [versionType, histories] of Object.entries(groupedByType)) {
      if (histories.length > 1) {
        // 최신 것 1개만 남기고 나머지는 삭제 대상
        const [latest, ...duplicates] = histories; // 이미 created_at 내림차순 정렬됨
        
        toKeep.push(latest);
        toDelete.push(...duplicates);
        
        console.log(`🔍 [${versionType}] 중복 발견:`, {
          '전체': histories.length,
          '유지': 1,
          '삭제 예정': duplicates.length,
          '최신 데이터': {
            id: latest.id,
            created_at: latest.created_at,
            image_count: latest.image_data?.length || 0
          },
          '삭제 대상': duplicates.map(d => ({
            id: d.id,
            created_at: d.created_at,
            image_count: d.image_data?.length || 0
          }))
        });
      } else {
        // 중복 없음
        toKeep.push(...histories);
        console.log(`✅ [${versionType}] 중복 없음:`, histories.length);
      }
    }

    console.log('📊 [removeDuplicateSliderHistory] 정리 계획:', {
      '유지할 데이터': toKeep.length,
      '삭제할 데이터': toDelete.length
    });

    // 4️⃣ 중복 데이터 삭제 실행
    let deletedCount = 0;
    if (toDelete.length > 0) {
      const deleteIds = toDelete.map(item => item.id);
      
      const { data: deleteResult, error: deleteError } = await supabase
        .from('slider_history')
        .delete()
        .in('id', deleteIds);

      if (deleteError) {
        console.error('❌ 중복 데이터 삭제 실패:', deleteError);
        throw deleteError;
      }

      deletedCount = deleteIds.length;
      console.log(`🗑️ 중복 SliderHistory ${deletedCount}개 삭제 완료`);
    }

    const result = {
      message: '중복 SliderHistory 정리 완료',
      deleted: deletedCount,
      kept: toKeep.length,
      details: {
        byType: Object.keys(groupedByType).map(type => ({
          version_type: type,
          original_count: groupedByType[type].length,
          after_cleanup: groupedByType[type].length > 1 ? 1 : groupedByType[type].length,
          deleted_count: Math.max(0, groupedByType[type].length - 1)
        })),
        deletedData: toDelete.map(item => ({
          id: item.id,
          version_type: item.version_type,
          created_at: item.created_at,
          image_count: item.image_data?.length || 0
        })),
        keptData: toKeep.map(item => ({
          id: item.id,
          version_type: item.version_type,
          created_at: item.created_at,
          image_count: item.image_data?.length || 0
        }))
      }
    };

    console.log('✅ [removeDuplicateSliderHistory] 정리 완료:', result);
    return result;

  } catch (error) {
    console.error('❌ [removeDuplicateSliderHistory] 실패:', error);
    throw error;
  }
}; 