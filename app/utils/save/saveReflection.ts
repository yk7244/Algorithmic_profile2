import { ReflectionData } from "@/app/types/profile";
import { getReflectionData } from "../get/getReflectionData";

// 전체 ReflectionData를 저장 (덮어쓰기)
export function setReflectionData() {
    const reflectionData = {
        id: "0",
        user_id: "0",
        timestamp: new Date().toISOString(),
        reflection1: false,
        reflection2: false,
        reflection1_answer: { answer1: "", answer2: "", answer3: "" },
        reflection2_answer: { answer1: "", answer2: "" }
        };
    console.log('🔵reflectionData',reflectionData);
    localStorage.setItem("reflectionData", JSON.stringify(reflectionData));
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
            reflection1_answer: { answer1: "", answer2: "", answer3: "" },
            reflection2_answer: { answer1: "", answer2: "" }
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
    const reflectionData = getReflectionData();
    const reflectionData_reflection1 = {
        id: reflectionData?.id,
        user_id: reflectionData?.user_id,
        timestamp: reflectionData?.timestamp,
        reflection1: true,
        reflection2: reflectionData?.reflection2,
        reflection1_answer: reflectionData?.reflection1_answer,
        reflection2_answer: reflectionData?.reflection2_answer,
    }   
    localStorage.setItem('reflectionData', JSON.stringify(reflectionData_reflection1));
    return reflectionData_reflection1;
}

export function setReflectionData_reflection2() {
    const reflectionData = getReflectionData();
    const reflectionData_reflection2 = {
        id: reflectionData?.id,
        user_id: reflectionData?.user_id,
        timestamp: reflectionData?.timestamp,
        reflection1: reflectionData?.reflection1,
        reflection2: true,
        reflection1_answer: reflectionData?.reflection1_answer,
        reflection2_answer: reflectionData?.reflection2_answer,
    }   
    localStorage.setItem('reflectionData', JSON.stringify(reflectionData_reflection2));
    return reflectionData_reflection2;
}
