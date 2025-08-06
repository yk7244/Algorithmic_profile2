import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type ImageRow = Database['public']['Tables']['image_data']['Row']
type ImageInsert = Database['public']['Tables']['image_data']['Insert']
type ImageUpdate = Database['public']['Tables']['image_data']['Update']

/**
 * 사용자의 현재 활성 이미지들 조회 (profileImages 대체)
 */
export async function getActiveUserImages(userId: string): Promise<ImageRow[]> {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .select('*')
      .eq('user_id', userId)
      .is('cluster_id', null) // 현재 활성 이미지들 (클러스터에 속하지 않은)
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
    console.log('🔄 createImages 시작:', { count: imagesData.length });
    console.log('📊 첫 번째 이미지 데이터 검증:', {
      hasUserId: !!imagesData[0]?.user_id,
      hasMainKeyword: !!imagesData[0]?.main_keyword,
      hasImageUrl: !!imagesData[0]?.image_url,
      imageUrlSample: imagesData[0]?.image_url?.substring(0, 50)
    });

    // 데이터 유효성 검증
    const invalidItems = imagesData.filter(item => !item.user_id || !item.image_url);
    if (invalidItems.length > 0) {
      console.error('❌ 유효하지 않은 이미지 데이터:', invalidItems.length, '개');
      console.error('첫 번째 유효하지 않은 데이터:', invalidItems[0]);
    }

    console.log('💾 Supabase insert 실행 중...');
    const insertStartTime = Date.now();
    
    const { data, error } = await supabase
      .from('image_data')
      .insert(imagesData)
      .select()

    const insertElapsed = Date.now() - insertStartTime;
    console.log(`⏱️ Supabase insert 완료: ${insertElapsed}ms`);

    if (error) {
      console.error('❌ createImages DB 에러:', error);
      console.error('에러 상세:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // 특정 에러 타입에 대한 추가 정보
      if (error.code === '23505') {
        console.error('🚨 중복 키 에러 - 동일한 이미지가 이미 존재함');
      } else if (error.code === '23503') {
        console.error('🚨 Foreign Key 에러 - 참조 무결성 위반');
      } else if (error.code === '23514') {
        console.error('🚨 체크 제약 조건 위반');
      }
      
      return [];
    }

    console.log('✅ createImages 성공:', data?.length || 0, '개 생성됨');
    return data || [];
  } catch (error) {
    console.error('❌ createImages 실행 중 예외:', error);
    console.error('예외 상세:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // 네트워크 에러 감지
    if (error instanceof Error && error.message.includes('fetch')) {
      console.error('🚨 네트워크 에러 - Supabase 연결 문제 가능성');
    }
    
    return [];
  }
}

// 중복 실행 방지를 위한 플래그 맵
const savingFlags = new Map<string, boolean>();

/**
 * 현재 활성 이미지들을 저장 (profileImages localStorage 대체)
 */
export async function saveActiveUserImages(userId: string, images: any[]): Promise<boolean> {
  // ✅ 중복 실행 방지
  if (savingFlags.get(userId)) {
    console.log('⚠️ saveActiveUserImages 이미 실행 중입니다. 중복 실행을 방지합니다:', userId);
    return false;
  }

  savingFlags.set(userId, true);

  try {
    console.log('🔄 saveActiveUserImages 시작:', { 
      userId: userId.substring(0, 8) + '...', 
      imageCount: images.length,
      timestamp: new Date().toISOString()
    });
    console.log('📋 이미지 데이터 미리보기:', images.slice(0, 2).map(img => ({
      id: img.id,
      main_keyword: img.main_keyword,
      src: img.src?.substring(0, 50) + '...'
    })));

    // ✅ 1. 먼저 기존 이미지 개수 확인
    console.log('📊 기존 이미지 개수 확인 중...');
    const { count: existingCount, error: countError } = await supabase
      .from('image_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('cluster_id', null);

    if (countError) {
      console.error('❌ 기존 이미지 개수 확인 실패:', countError);
    } else {
      console.log(`📈 기존 활성 이미지 개수: ${existingCount}개`);
    }

    // 2. 기존 활성 이미지들 삭제
    console.log('🗑️ 기존 활성 이미지 삭제 중...');
    const deleteStartTime = Date.now();
    
    const { error: deleteError } = await supabase
      .from('image_data')
      .delete()
      .eq('user_id', userId)
      .is('cluster_id', null)

    const deleteElapsed = Date.now() - deleteStartTime;
    console.log(`✅ 기존 이미지 삭제 완료: ${deleteElapsed}ms`);

    if (deleteError) {
      console.error('❌ 기존 이미지 삭제 실패:', deleteError);
      return false;
    }

    // 2. 새 이미지들 저장
    if (images.length > 0) {
      console.log('📝 새 이미지 데이터 변환 중...');
      const imageInserts: ImageInsert[] = images
        .map((img, index) => {
          // 필수 필드 유효성 검사
          const mainKeyword = img.main_keyword || 'unknown';
          const keywords = Array.isArray(img.keywords) ? img.keywords : [];
          const imageUrl = img.src || img.image_url || '';
          
          // 필수 필드가 비어있으면 기본값 설정
          if (!mainKeyword || mainKeyword.trim() === '') {
            console.warn(`⚠️ 이미지 ${index}의 main_keyword가 비어있음, 기본값 사용:`, img);
          }
          
          if (!imageUrl || imageUrl.trim() === '') {
            console.error(`❌ 이미지 ${index}의 image_url이 비어있음, 스킵:`, img);
            return null; // 유효하지 않은 데이터는 null 반환
          }

          const insert = {
            user_id: userId,
            main_keyword: mainKeyword.trim() || 'unknown',
            keywords: keywords.length > 0 ? keywords : ['general'],
            mood_keyword: img.mood_keyword || null,
            description: img.description || null,
            category: img.category || null,
            image_url: imageUrl.trim(),
            width: img.width || 200,
            height: img.height || 200,
            size_weight: img.sizeWeight || 1.0,
            position_x: img.position?.x || 0,
            position_y: img.position?.y || 0,
            rotate: img.rotate || 0,
            css_left: img.left || null,
            css_top: img.top || null,
            frame_style: img.frameStyle || 'normal',
            related_videos: img.relatedVideos || [],
            desired_self: img.desired_self || false,
            desired_self_profile: img.desired_self_profile || null,
            metadata: img.metadata || {},
            similarity: img.similarity || null
          };

          // 첫 번째 이미지의 변환 결과 로그
          if (index === 0) {
            console.log('📊 변환된 첫 번째 이미지 데이터:', insert);
          }

          return insert;
        })
        .filter((insert): insert is ImageInsert => insert !== null); // null 값 필터링

      console.log(`✅ 유효한 이미지 데이터: ${imageInserts.length}개 (전체 ${images.length}개 중)`);

      if (imageInserts.length === 0) {
        console.warn('⚠️ 유효한 이미지 데이터가 없습니다. 모든 이미지가 필터링됨');
        return true; // 데이터가 없는 것은 실패가 아님
      }

      console.log(`💾 createImages 호출: ${imageInserts.length}개 이미지`);
      const insertStartTime = Date.now();
      
      const result = await createImages(imageInserts);
      
      const insertElapsed = Date.now() - insertStartTime;
      console.log(`✅ 이미지 삽입 완료: ${insertElapsed}ms, 성공: ${result.length}개`);
      
      // ✅ 최종 확인: 저장된 이미지 개수 재확인
      console.log('🔍 최종 확인: 저장된 이미지 개수 재확인...');
      const { count: finalCount, error: finalCountError } = await supabase
        .from('image_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('cluster_id', null);

      if (finalCountError) {
        console.error('❌ 최종 이미지 개수 확인 실패:', finalCountError);
      } else {
        console.log(`📊 최종 저장된 활성 이미지 개수: ${finalCount}개`);
        
        // ✅ 예상과 다른 경우 경고
        if (finalCount !== images.length) {
          console.warn(`⚠️ 이미지 개수 불일치! 요청: ${images.length}개, 실제 저장: ${finalCount}개`);
        } else {
          console.log('✅ 이미지 개수 일치 확인됨');
        }
      }
      
      return result.length > 0;
    }

    console.log('✅ saveActiveUserImages 완료: 저장할 이미지 없음');
    return true;
  } catch (error) {
    console.error('❌ saveActiveUserImages 실행 중 오류:', error);
    console.error('에러 상세:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  } finally {
    // ✅ 실행 완료 시 플래그 해제
    savingFlags.delete(userId);
    console.log('🔓 saveActiveUserImages 플래그 해제:', userId);
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
 * 이미지 위치 업데이트 (CSS 스타일 및 position 필드 모두 업데이트)
 */
export async function updateImagePosition(imageId: string, x: number, y: number): Promise<boolean> {
  try {
    console.log(`🔄 updateImagePosition: ${imageId}, x: ${x}, y: ${y}`);
    
    const { error } = await supabase
      .from('image_data')
      .update({ 
        css_left: `${x}px`,
        css_top: `${y}px`,
        position_x: x, 
        position_y: y 
      })
      .eq('id', imageId)

    if (error) {
      console.error('❌ updateImagePosition DB 에러:', error)
      return false
    }

    console.log(`✅ updateImagePosition 성공: ${imageId}`);
    return true
  } catch (error) {
    console.error('❌ updateImagePosition 실행 중 오류:', error)
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
    console.log('🔍 [getPublicUserImages] 시작:', userId);
    
    // 먼저 사용자의 open_to_connect 상태 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('open_to_connect, nickname')
      .eq('id', userId)
      .single()
    
    console.log('🔍 [getPublicUserImages] 사용자 정보:', {
      userId,
      nickname: userData?.nickname,
      open_to_connect: userData?.open_to_connect,
      userError: userError?.message
    });
    
    if (userError || !userData?.open_to_connect) {
      console.warn('⚠️ [getPublicUserImages] 사용자가 공개 설정이 아님 또는 찾을 수 없음');
      return [];
    }
    
    // 사용자의 모든 이미지 확인 (cluster_id 포함) - 올바른 컬럼명 사용
    const { data: allImages, error: allImagesError } = await supabase
      .from('image_data')
      .select('id, main_keyword, cluster_id, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (allImagesError) {
      console.warn('⚠️ [getPublicUserImages] 모든 이미지 디버깅 쿼리 실패:', allImagesError.message);
      console.log('🔍 [getPublicUserImages] 사용자의 모든 이미지: 디버깅 쿼리 실패로 건너뜀');
    } else {
      console.log('🔍 [getPublicUserImages] 사용자의 모든 이미지:', {
        totalCount: allImages?.length || 0,
        activeCount: allImages?.filter(img => img.cluster_id === null).length || 0,
        clusteredCount: allImages?.filter(img => img.cluster_id !== null).length || 0,
        sampleImages: allImages?.slice(0, 3).map(img => ({
          id: img.id,
          main_keyword: img.main_keyword,
          cluster_id: img.cluster_id,
          hasSrc: !!img.src
        }))
      });
    }
    
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
      console.error('❌ [getPublicUserImages] DB 에러:', error)
      return []
    }

    console.log('🔍 [getPublicUserImages] 최종 결과:', {
      publicImageCount: data?.length || 0,
      sampleData: data?.slice(0, 2).map(img => ({
        id: img.id,
        main_keyword: img.main_keyword,
        hasSrc: !!(img.src || img.image_url)
      }))
    });

    return data || []
  } catch (error) {
    console.error('❌ [getPublicUserImages] 실행 중 오류:', error)
    return []
  }
}

/**
 * 키워드로 이미지 검색 (개선된 유연한 매칭)
 */
export async function searchImagesByKeyword(keyword: string, limit: number = 20, excludeUserId?: string): Promise<ImageRow[]> {
  try {
    console.log(`🔍 searchImagesByKeyword 실행: "${keyword}", excludeUserId: ${excludeUserId}`);
    
    // 키워드를 공백으로 분리하여 부분 매칭 향상
    const keywordParts = keyword.trim().split(/\s+/);
    console.log(`🔍 키워드 부분들:`, keywordParts);
    
    let query = supabase
      .from('image_data')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('users.open_to_connect', true)
      .is('cluster_id', null) // 클러스터 이미지만

    // ✅ 현재 사용자 제외
    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId)
    }

    const { data: allData, error } = await query
      .limit(limit * 3) // 더 많이 가져와서 클라이언트에서 필터링
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ searchImagesByKeyword DB 에러:', error)
      return []
    }

    if (!allData || allData.length === 0) {
      console.log('⚠️ searchImagesByKeyword: DB에서 가져온 데이터가 없음')
      return []
    }

    console.log(`🔍 DB에서 가져온 전체 데이터: ${allData.length}개`);
    
    // 클라이언트에서 유연한 키워드 매칭
    const matchedData = allData.filter(item => {
      const mainKeyword = (item.main_keyword || '').toLowerCase();
      const keywords = Array.isArray(item.keywords) ? item.keywords : [];
      const keywordsString = keywords.join(' ').toLowerCase();
      const searchText = `${mainKeyword} ${keywordsString}`;
      
      // 키워드 부분들 중 하나라도 포함되면 매칭
      const isMatched = keywordParts.some(part => 
        searchText.includes(part.toLowerCase())
      );
      
      if (isMatched) {
        console.log(`✅ 매칭됨: "${item.main_keyword}" (키워드: ${keywords.join(', ')})`);
      }
      
      return isMatched;
    });

    console.log(`🔍 키워드 매칭 결과: ${matchedData.length}개`);
    
    // 결과 제한
    const finalResult = matchedData.slice(0, limit);
    console.log(`🔍 최종 반환: ${finalResult.length}개`);
    
    return finalResult;
  } catch (error) {
    console.error('❌ searchImagesByKeyword 실행 중 오류:', error)
    return []
  }
}

/**
 * 모든 공개 이미지 조회 (현재 사용자 제외)
 */
export async function getAllPublicImages(limit: number = 50, excludeUserId?: string): Promise<ImageRow[]> {
  try {
    console.log(`🔍 getAllPublicImages 실행: limit=${limit}, excludeUserId=${excludeUserId}`);
    
    let query = supabase
      .from('image_data')
      .select(`
        *,
        users!inner(open_to_connect)
      `)
      .eq('users.open_to_connect', true)
      .is('cluster_id', null) // 현재 활성 이미지들만
      .limit(limit)
      .order('created_at', { ascending: false })

    // ✅ 현재 사용자 제외
    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId)
      console.log(`🔍 현재 사용자 제외 필터 적용: ${excludeUserId}`);
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ getAllPublicImages DB 에러:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('⚠️ getAllPublicImages: DB에서 가져온 데이터가 없음')
      return []
    }

    console.log(`🔍 getAllPublicImages 결과: ${data.length}개 이미지 조회됨`);
    console.log(`🔍 샘플 데이터:`, data.slice(0, 2).map(item => ({
      user_id: item.user_id,
      main_keyword: item.main_keyword,
      keywords: item.keywords
    })));

    return data || []
  } catch (error) {
    console.error('❌ getAllPublicImages 실행 중 오류:', error)
    return []
  }
}

/**
 * localStorage의 profileImages를 DB 형식으로 변환
 */
export function convertLocalStorageImagesToDB(localImages: any[]): ImageInsert[] {
  return localImages.map(img => ({
    user_id: '', // 호출할 때 설정
    main_keyword: img.main_keyword || '',
    keywords: img.keywords || [],
    mood_keyword: img.mood_keyword || null,
    description: img.description || null,
    category: img.category || null,
    image_url: img.src || '',
    width: img.width || 200,
    height: img.height || 200,
    size_weight: img.sizeWeight || 1.0,
    position_x: img.position?.x || 0,
    position_y: img.position?.y || 0,
    rotate: img.rotate || 0,
    css_left: img.left || null,
    css_top: img.top || null,
    frame_style: img.frameStyle || 'normal',
    related_videos: img.relatedVideos || [],
    desired_self: img.desired_self || false,
    desired_self_profile: img.desired_self_profile || null,
    metadata: img.metadata || {},
    similarity: img.similarity || null
  }))
}

/**
 * DB 이미지를 localStorage 형식으로 변환
 */
export function convertDBImagesToLocalStorage(dbImages: ImageRow[]): any[] {
  return dbImages.map(img => ({
    id: img.id,
    main_keyword: img.main_keyword,
    keywords: img.keywords,
    mood_keyword: img.mood_keyword,
    description: img.description,
    category: img.category,
    src: img.image_url,
    width: img.width,
    height: img.height,
    sizeWeight: img.size_weight,
    position: {
      x: img.position_x,
      y: img.position_y
    },
    rotate: img.rotate,
    left: img.css_left,
    top: img.css_top,
    frameStyle: img.frame_style,
    relatedVideos: img.related_videos,
    desired_self: img.desired_self,
    desired_self_profile: img.desired_self_profile,
    metadata: img.metadata,
    similarity: img.similarity,
    created_at: img.created_at,
    updated_at: img.updated_at
  }))
}