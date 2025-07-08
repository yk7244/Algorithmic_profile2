import { WatchHistory_array } from "@/app/types/profile";
import { getWatchHistory } from "../get/getWatchHistory";
import { getWatchHistory_array } from "../get/getWatchHistory_array";

export function saveWatchHistory(watchHistory: any[], localStorageObj: Storage = localStorage) {
    const prev = getWatchHistory();
    const today = new Date().toISOString().slice(0, 10);
  
    const withDate = (watchHistory || [])
        .filter(item => item && typeof item === "object") // null 방지
        .map(item => ({
            ...item,
            timestamp: item.timestamp || today,
        }));
  
    const merged = [...prev, ...withDate];
    localStorageObj.setItem("watchHistory", JSON.stringify(merged));
}


