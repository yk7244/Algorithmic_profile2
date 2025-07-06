import { WatchHistory } from "@/app/types/profile";

export function getSliderHistory(): WatchHistory[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("SliderHistory") || "[]");
    } catch {
        return [];
    }
}