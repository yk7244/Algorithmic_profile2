import { WatchHistoryItem } from "@/app/upload/VideoAnalysis/videoCluster";
import { ReflectionData } from "../../types/profile";

import { getUserData } from "@/app/utils/get/getUserData";
import { getReflectionData } from "../get/getReflectionData";

export function setReflectionData() {
    const userData = getUserData();
    console.log('저장하기');
    const reflectionData = {
        id: new Date().getTime().toString(),
        user_id: userData.id,
        timestamp: new Date().toISOString(),
        reflection1: false,
        reflection2: false,
    }
    localStorage.setItem('reflectionData', JSON.stringify(reflectionData));
    return reflectionData;
}

export function setReflectionData_reflection1() {
    console.log('setReflectionData_reflection1');
    const reflectionData = getReflectionData();
    console.log('저장하기');
    const reflectionData_reflection1 = {
        id: reflectionData?.id,
        user_id: reflectionData?.user_id,
        timestamp: reflectionData?.timestamp,
        reflection1: true,
        reflection2: reflectionData?.reflection2,
    }   
    localStorage.setItem('reflectionData', JSON.stringify(reflectionData_reflection1));
    return reflectionData_reflection1;
}

export function setReflectionData_reflection2() {
    const reflectionData = getReflectionData();
    console.log('저장하기');    
    const reflectionData_reflection2 = {
        id: reflectionData?.id,
        user_id: reflectionData?.user_id,   
        timestamp: reflectionData?.timestamp,    
        reflection1: reflectionData?.reflection1,
        reflection2: true,
    }   
    localStorage.setItem('reflectionData', JSON.stringify(reflectionData_reflection2));
    return reflectionData_reflection2;
}