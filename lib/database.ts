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