import { Reflection_answer, ReflectionData } from "../../types/profile";
import { 
    getReflectionData as getReflectionDataDB, 
    getReflectionAnswers,
    convertDBReflectionToLocalStorage 
} from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에서 리플렉션 데이터 조회 (localStorage 대체)
export async function getReflectionData(): Promise<ReflectionData | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        let dbReflection = null;
        try {
            dbReflection = await getReflectionDataDB(user.id);
            console.log('✅ reflections 테이블 정상 접근 성공');
        } catch (error) {
            console.warn('⚠️ reflections 테이블 접근 실패, 기본값 사용:', error);
            // DB 접근 실패 시 기본값으로 계속 진행
        }
        
        // DB에 데이터가 없으면 기본값 반환 (더미 데이터 방지)
        if (!dbReflection) {
            const reflectionData = localStorage.getItem("reflectionData");
            if (reflectionData && !sessionStorage.getItem('reflection_data_warning_shown')) {
                console.log('⚠️ localStorage에 리플렉션 데이터가 있지만 더미 데이터일 가능성이 높아 무시합니다');
                console.log('💡 실제 리플렉션 데이터는 업로드 후 자동으로 생성됩니다');
                sessionStorage.setItem('reflection_data_warning_shown', 'true'); // 세션당 한 번만 표시
            }
            // 기본값 반환: 모든 reflection이 완료되지 않은 상태
            return {
                reflection1: false,
                reflection2: false,
                searched: false,
                tutorial: false
            };
        }

        // DB 형식을 기존 ReflectionData 형식으로 변환
        return convertDBReflectionToLocalStorage(dbReflection);
    } catch (error) {
        console.error('DB에서 리플렉션 데이터 조회 중 오류:', error);
        
        // 오류 시에도 더미 데이터 대신 기본값 반환
        const reflectionData = localStorage.getItem("reflectionData");
        if (reflectionData) {
            console.log('⚠️ DB 오류로 인해 localStorage 확인했지만 더미 데이터일 가능성이 높아 기본값 반환');
        }
        
        // 기본값 반환: 모든 reflection이 완료되지 않은 상태
        return {
            reflection1: false,
            reflection2: false,
            searched: false,
            tutorial: false
        };
    }
}

// DB에서 리플렉션 답변 조회 (localStorage 대체)
export async function getReflection_answer(): Promise<Reflection_answer[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const dbAnswers = await getReflectionAnswers(user.id);
        
        // DB에 데이터가 없으면 localStorage 확인
        if (!dbAnswers || dbAnswers.length === 0) {
            const reflection_answer = localStorage.getItem("reflection_answer");
            if (reflection_answer) {
                const localAnswers = JSON.parse(reflection_answer);
                console.log('localStorage에서 리플렉션 답변 발견');
                // TODO: 자동 마이그레이션 로직 추가
                return localAnswers;
            }
            return [];
        }

        // DB의 reflection_data를 기존 형식으로 변환
        return dbAnswers.flatMap(item => item.reflection_data || []);
    } catch (error) {
        console.error('DB에서 리플렉션 답변 조회 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        const reflection_answer = localStorage.getItem("reflection_answer");
        return reflection_answer ? JSON.parse(reflection_answer) : [];
    }
}

// 동기 버전들 (기존 호환성, deprecated)
export function getReflectionDataSync(): ReflectionData | null {
    console.warn('getReflectionDataSync is deprecated. Use getReflectionData() instead.');
    const reflectionData = localStorage.getItem("reflectionData");
    return reflectionData ? JSON.parse(reflectionData) : null;
}

export function getReflection_answerSync(): Reflection_answer[] {
    console.warn('getReflection_answerSync is deprecated. Use getReflection_answer() instead.');
    const reflection_answer = localStorage.getItem("reflection_answer");
    return reflection_answer ? JSON.parse(reflection_answer) : [];
} 