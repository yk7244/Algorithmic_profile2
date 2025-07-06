import { WatchHistory } from "@/app/types/profile";

export function getWatchHistory(): WatchHistory[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("watchHistory") || "[]");
    } catch {
        return [];
    }
}