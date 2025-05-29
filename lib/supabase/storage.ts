import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Pinterest 이미지를 Supabase Storage에 업로드합니다.
 * @param imageUrl Pinterest 이미지 URL
 * @param userId 사용자 ID
 * @param clusterId 클러스터 ID
 * @param keyword 키워드 (파일명에 사용)
 * @returns 업로드된 이미지의 Supabase Storage URL
 */
export async function uploadPinterestImageToStorage(
  imageUrl: string,
  userId: string,
  clusterId: string,
  keyword: string
): Promise<string> {
  try {
    console.log('🔄 이미지 다운로드 시작:', imageUrl);
    
    // 1. Pinterest 이미지를 fetch로 다운로드
    const response = await fetch('/api/download-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl })
    });

    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }

    const blob = await response.blob();
    console.log('✅ 이미지 다운로드 완료, 크기:', blob.size, 'bytes');

    // 2. 파일명 생성 (키워드 + 타임스탬프) - URL-safe하게 변경
    const timestamp = Date.now();
    // 한글과 특수문자를 모두 제거하고 영어/숫자/하이픈/언더스코어만 허용
    const cleanKeyword = keyword
      .replace(/[^a-zA-Z0-9\-_]/g, '') // 한글 포함 모든 특수문자 제거
      .toLowerCase() // 소문자로 변환
      .substring(0, 20); // 길이 제한
    
    // cleanKeyword가 비어있으면 기본값 사용
    const safeKeyword = cleanKeyword || 'image';
    const fileExtension = getImageExtension(imageUrl) || 'jpg';
    const fileName = `${userId}/${clusterId}_${safeKeyword}_${timestamp}.${fileExtension}`;

    console.log('📁 원본 키워드:', keyword);
    console.log('📁 정제된 키워드:', safeKeyword);
    console.log('📁 최종 파일명:', fileName);

    // 3. Supabase Storage에 업로드 (버킷 존재 여부 확인 후 생성)
    try {
      // 버킷 존재 여부 확인
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('⚠️ 버킷 목록 조회 실패:', listError);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'cluster-images');
      
      if (!bucketExists) {
        console.log('📦 cluster-images 버킷이 없어서 생성 시도 중...');
        const { error: createBucketError } = await supabase.storage.createBucket('cluster-images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 1024 * 1024 * 10 // 10MB
        });
        
        if (createBucketError) {
          console.warn('⚠️ 버킷 생성 실패 (이미 존재할 수 있음):', createBucketError.message);
        } else {
          console.log('✅ cluster-images 버킷 생성 완료');
        }
      }
    } catch (bucketError) {
      console.warn('⚠️ 버킷 확인/생성 중 오류 (계속 진행):', bucketError);
    }
    
    // 4. 파일 업로드
    const { data, error } = await supabase.storage
      .from('cluster-images')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('❌ Storage 업로드 실패:', error);
      console.error('❌ 실패한 파일명:', fileName);
      console.error('❌ Blob 정보:', {
        size: blob.size,
        type: blob.type
      });
      
      // 파일명 문제일 경우 더 간단한 이름으로 재시도
      if (error.message?.includes('Invalid key') || error.message?.includes('InvalidKey')) {
        console.log('🔄 파일명 문제로 간단한 이름으로 재시도...');
        const simpleFileName = `${userId}/img_${timestamp}.${fileExtension}`;
        console.log('🔄 재시도 파일명:', simpleFileName);
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('cluster-images')
          .upload(simpleFileName, blob, {
            contentType: blob.type || 'image/jpeg',
            upsert: true
          });
          
        if (retryError) {
          console.error('❌ 재시도도 실패:', retryError);
          throw retryError;
        }
        
        console.log('✅ 재시도 성공:', retryData.path);
        
        // 5. Public URL 생성 (재시도 성공한 경우)
        const { data: publicUrlData } = supabase.storage
          .from('cluster-images')
          .getPublicUrl(retryData.path);

        const publicUrl = publicUrlData.publicUrl;
        console.log('🌐 Public URL 생성 (재시도):', publicUrl);

        return publicUrl;
      }
      
      throw error;
    }

    console.log('✅ Storage 업로드 성공:', data.path);

    // 5. Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('cluster-images')
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData.publicUrl;
    console.log('🌐 Public URL 생성:', publicUrl);

    return publicUrl;

  } catch (error) {
    console.error('❌ 이미지 업로드 실패:', error);
    throw error;
  }
}

/**
 * URL에서 이미지 확장자 추출
 */
function getImageExtension(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Storage에서 이미지 삭제
 */
export async function deleteImageFromStorage(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('cluster-images')
      .remove([filePath]);

    if (error) {
      console.error('❌ Storage 이미지 삭제 실패:', error);
      throw error;
    }

    console.log('✅ Storage 이미지 삭제 성공:', filePath);
  } catch (error) {
    console.error('❌ 이미지 삭제 중 오류:', error);
    throw error;
  }
}

/**
 * Storage 상태 확인 및 버킷 정보 출력
 */
export async function checkStorageStatus(): Promise<void> {
  try {
    console.log('🔍 Storage 상태 확인 중...');
    
    // 버킷 목록 조회
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ 버킷 목록 조회 실패:', listError);
      return;
    }
    
    console.log('📦 사용 가능한 버킷들:', buckets?.map(b => ({
      name: b.name,
      public: b.public,
      created_at: b.created_at
    })));
    
    // cluster-images 버킷 존재 여부 확인
    const clusterBucket = buckets?.find(bucket => bucket.name === 'cluster-images');
    
    if (clusterBucket) {
      console.log('✅ cluster-images 버킷 존재함:', {
        public: clusterBucket.public,
        created_at: clusterBucket.created_at
      });
    } else {
      console.log('❌ cluster-images 버킷이 없습니다. 자동 생성을 시도합니다.');
    }
    
  } catch (error) {
    console.error('❌ Storage 상태 확인 중 오류:', error);
  }
} 