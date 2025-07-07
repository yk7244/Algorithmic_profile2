import { WatchHistory_array } from "@/app/types/profile";

export function getWatchHistory_array(): WatchHistory_array[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("watchHistory_array") || "[]");
    } catch {
        return [];
    }
}