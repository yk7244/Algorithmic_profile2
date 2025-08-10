import { ReflectionData } from "@/app/types/profile";
import { 
    getReflection_answer, 
    getReflectionData, 
    getReflectionDataSync, 
    getReflection_answerSync 
} from "../get/getReflectionData";
import { 
    setSearchCompleted,
    setTutorialCompleted,
    setReflection1Completed,
    setReflection2Completed,
    saveReflectionAnswers,
    createReflectionData
} from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// 전체 ReflectionData를 저장 (덮어쓰기) - DB 버전
export async function setReflectionData(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ 사용자 인증 정보를 찾을 수 없습니다.');
            return false;
        }

        const reflectionData = {
            user_id: user.id,
            reflection1: false,
            reflection2: false,
            searched: false,
            tutorial: false,
            reflection1_answers: { answer1: "", answer2: "", answer3: "" },
            reflection2_answers: { answer1: "", answer2: "" }
        };
        
        console.log('🔄 ReflectionData DB 저장 중:', reflectionData);
        const result = await createReflectionData(reflectionData);
        
        if (result) {
            console.log('✅ ReflectionData DB 저장 성공');
            return true;
        } else {
            console.error('❌ ReflectionData DB 저장 실패');
            return false;
        }
    } catch (error) {
        console.error('❌ setReflectionData 실행 중 오류:', error);
        return false;
    }
}

// 동기 버전 (기존 호환성용, deprecated)
export function setReflectionDataSync() {
    console.warn('setReflectionDataSync is deprecated. Use setReflectionData() instead.');
    const reflectionData = {
        id: "0",
        user_id: "0",
        timestamp: new Date().toISOString(),
        reflection1: false,
        reflection2: false,
        searched: false,
        tutorial: false,
        reflection1_answer: { answer1: "", answer2: "", answer3: "" },
        reflection2_answer: { answer1: "", answer2: "" }
        };
    //console.log('🔵reflectionData',reflectionData);
    localStorage.setItem("reflectionData", JSON.stringify(reflectionData));
}
export function setReflectionData_searched() {
    const reflectionData = getReflectionDataSync();
    //console.log('🔵setReflectionData_searched 전    : ', reflectionData?.searched);

    if (reflectionData) {
        reflectionData.searched = true;
        localStorage.setItem("reflectionData", JSON.stringify(reflectionData));
    }
    //console.log('🔵setReflectionData_searched 후    : ', reflectionData?.searched);
}

export function setReflectionData_tutorial() {
    const reflectionData = getReflectionDataSync();
    if (reflectionData) {
        reflectionData.tutorial = true;
        localStorage.setItem("reflectionData", JSON.stringify(reflectionData));
    }
}

// 리플렉션 답변 계속 쌓기
export function setReflection_answer() {
    const reflection_answer = getReflection_answerSync();
    const reflection = getReflectionDataSync();
    console.log('🔵가져온 reflection_answer',reflection_answer);
    const new_reflection_answer = {
        id: "0",
        user_id: "0",
        timestamp: new Date().toISOString(),
        searched: reflection?.searched,
        tutorial: reflection?.tutorial,
        reflection_data: reflection,
    }
    localStorage.setItem("reflection_answer", JSON.stringify([...reflection_answer, new_reflection_answer]));
}

// 특정 답변만 업데이트 (reflection1/2, answer1/2/3)
export function updateReflectionAnswer({
    reflectionKey,
    answerKey,
    value,
    }: {
        reflectionKey: "reflection1_answer" | "reflection2_answer";
        answerKey: "answer1" | "answer2" | "answer3";
        value: string;
    }) {
        const prev = localStorage.getItem("reflectionData");
    
        let data: ReflectionData;
        if (prev) {
        data = JSON.parse(prev);
        } else {
        data = {
            id: "",
            user_id: "",
            timestamp: new Date().toISOString(),
            reflection1: false,
            reflection2: false,
            searched: false,
            tutorial: false,
            reflection1_answer: { answer1: "", answer2: "", answer3: "" },
            reflection2_answer: { answer1: "", answer2: "" },
            reflection1_completed: false,
            reflection2_completed: false,
        };
        }
    
        if (data[reflectionKey]) {
        (data[reflectionKey] as any)[answerKey] = value;
        } else {
        console.warn(`⚠️ ${reflectionKey} is undefined in reflectionData`);
        }
    
        localStorage.setItem("reflectionData", JSON.stringify(data));
}

export function setReflectionData_reflection1() {
    const reflectionData = getReflectionDataSync();
    const reflectionData_reflection1 = {
        id: reflectionData?.id,
        user_id: reflectionData?.user_id,
        timestamp: reflectionData?.timestamp,
        reflection1: true,
        reflection2: reflectionData?.reflection2,
        searched: reflectionData?.searched,
        tutorial: reflectionData?.tutorial,
        reflection1_answer: reflectionData?.reflection1_answer,
        reflection2_answer: reflectionData?.reflection2_answer,
        reflection1_completed: true,
        reflection2_completed: reflectionData?.reflection2_completed,
    }   
    localStorage.setItem('reflectionData', JSON.stringify(reflectionData_reflection1));
    return reflectionData_reflection1;
}

export function setReflectionData_reflection2() {
    const reflectionData = getReflectionDataSync();
    const reflectionData_reflection2 = {
        id: reflectionData?.id,
        user_id: reflectionData?.user_id,
        timestamp: reflectionData?.timestamp,
        reflection1: reflectionData?.reflection1,
        reflection2: true,
        searched: reflectionData?.searched,
        tutorial: reflectionData?.tutorial,
        reflection1_answer: reflectionData?.reflection1_answer,
        reflection2_answer: reflectionData?.reflection2_answer,
        reflection1_completed: reflectionData?.reflection1_completed,
        reflection2_completed: true,
    }   
    localStorage.setItem('reflectionData', JSON.stringify(reflectionData_reflection2));
    return reflectionData_reflection2;
}

// ========================================
// 새로운 DB 버전 함수들 (localStorage 대체)
// ========================================

// DB에 검색 완료 상태 설정
export async function setReflectionData_searchedDB(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const result = await setSearchCompleted(user.id);
        return result !== null;
    } catch (error) {
        console.error('DB에 검색 완료 상태 저장 중 오류:', error);
        return false;
    }
}

// DB에 튜토리얼 완료 상태 설정
export async function setReflectionData_tutorialDB(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const result = await setTutorialCompleted(user.id);
        return result !== null;
    } catch (error) {
        console.error('DB에 튜토리얼 완료 상태 저장 중 오류:', error);
        return false;
    }
}

// DB에 리플렉션 1 완료 상태 설정
export async function setReflectionData_reflection1DB(answers: any): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const result = await setReflection1Completed(user.id, answers);
        return result !== null;
    } catch (error) {
        console.error('DB에 리플렉션 1 완료 상태 저장 중 오류:', error);
        return false;
    }
}

// DB에 리플렉션 2 완료 상태 설정
export async function setReflectionData_reflection2DB(answers: any): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const result = await setReflection2Completed(user.id, answers);
        return result !== null;
    } catch (error) {
        console.error('DB에 리플렉션 2 완료 상태 저장 중 오류:', error);
        return false;
    }
}

// DB에 리플렉션 답변 저장
export async function setReflection_answerDB(reflectionData: any[]): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const result = await saveReflectionAnswers(user.id, reflectionData);
        return result !== null;
    } catch (error) {
        console.error('DB에 리플렉션 답변 저장 중 오류:', error);
        return false;
    }
}

// DB에 전체 리플렉션 데이터 생성
export async function setReflectionDataDB(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const reflectionData = {
            user_id: user.id,
            reflection1_completed: false,
            reflection2_completed: false,
            searched: false,
            tutorial: false,
            reflection1_answers: { answer1: "", answer2: "", answer3: "" },
            reflection2_answers: { answer1: "", answer2: "" },
            timestamp: new Date().toISOString()
        };

        const result = await createReflectionData(reflectionData);
        return result !== null;
    } catch (error) {
        console.error('DB에 리플렉션 데이터 생성 중 오류:', error);
        return false;
    }
}


