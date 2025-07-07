import { ReflectionData } from "../../types/profile";

export function getReflectionData(): ReflectionData | null {
    const reflectionData = localStorage.getItem("reflectionData");
    return reflectionData ? JSON.parse(reflectionData) : null;
  }