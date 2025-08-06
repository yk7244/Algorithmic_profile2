import { saveActiveUserImages } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에 프로필 이미지 저장 (localStorage 대체)
export async function saveProfileImages(images: any[]): Promise<boolean> {
  try {
    console.log('🔄 saveProfileImages 시작: 이미지 개수', images.length);
    console.log('📊 저장할 이미지 데이터 샘플:', images.slice(0, 2));

    console.log('🔐 사용자 인증 정보 확인 중...');
    const authStartTime = Date.now();
    
    // ✅ 사용자 인증에도 5초 타임아웃 적용
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('사용자 인증 확인 타임아웃 (5초)')), 5000)
      )
    ]);
    
    const authElapsed = Date.now() - authStartTime;
    console.log(`⏱️ 사용자 인증 확인 완료: ${authElapsed}ms`);
    
    const { data: { user } } = authResult;
    if (!user) {
      console.error('❌ 사용자 인증 정보를 찾을 수 없습니다.');
      console.log('🔍 인증 상태 디버깅:', {
        hasData: !!authResult.data,
        hasUser: !!user,
        authResultKeys: Object.keys(authResult.data || {}),
        userData: authResult.data?.user ? {
          id: authResult.data.user.id,
          email: authResult.data.user.email
        } : null
      });
      return false;
    }
    console.log('✅ 사용자 인증 확인:', {
      userId: user.id,
      email: user.email,
      isAuthenticated: true
    });

    console.log('🔄 saveActiveUserImages 호출 시작...');
    const startTime = Date.now();
    
    const success = await Promise.race([
      saveActiveUserImages(user.id, images),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('saveActiveUserImages 타임아웃 (30초)')), 30000)
      )
    ]);
    
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ saveActiveUserImages 완료: ${elapsed}ms`);

    if (success) {
      console.log('✅ 프로필 이미지 DB 저장 완료:', images.length, '개');
    } else {
      console.error('❌ 프로필 이미지 DB 저장 실패');
    }

    return success;
  } catch (error) {
    console.error('❌ saveProfileImages 실행 중 치명적 오류:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error) {
      if (error.message.includes('인증 확인 타임아웃')) {
        console.error('🚨 사용자 인증 확인 타임아웃 발생 - Supabase Auth 서비스 문제 가능성');
        console.log('🔄 AuthContext에서 사용자 정보 fallback 시도...');
        
        // ✅ AuthContext fallback 시도
        try {
          if (typeof window !== 'undefined') {
            const authContextData = localStorage.getItem('sb-zectwulnxyhcbskgnhfr-auth-token');
            if (authContextData) {
              console.log('📦 localStorage에서 인증 토큰 발견, 하지만 saveProfileImages는 실패로 처리');
            }
          }
        } catch (fallbackError) {
          console.error('❌ fallback 시도 실패:', fallbackError);
        }
        
      } else if (error.message.includes('saveActiveUserImages 타임아웃')) {
        console.error('🚨 DB 저장 타임아웃 발생 - 네트워크 연결 또는 DB 성능 문제 가능성');
      }
    }
    
    return false;
  }
}

// 동기 버전 (기존 호환성, deprecated)
export function saveProfileImagesSync(images: any[], localStorageObj: Storage = localStorage) {
  console.warn('saveProfileImagesSync is deprecated. Use saveProfileImages() instead.');
  
  // localStorage 저장은 제거하고 비동기 DB 저장만 실행
  saveProfileImages(images).catch(console.error);
}
