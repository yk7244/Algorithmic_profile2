import { Reflection_answer, ReflectionData } from "../../types/profile";

export function getReflectionData(): ReflectionData | null {
    const reflectionData = localStorage.getItem("reflectionData");
    return reflectionData ? JSON.parse(reflectionData) : null;
  }

export function getReflection_answer(): Reflection_answer[] {
    const reflection_answer = localStorage.getItem("reflection_answer");
    return reflection_answer ? JSON.parse(reflection_answer) : [] ;
} 