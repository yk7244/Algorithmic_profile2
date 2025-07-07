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


export function saveWatchHistory_array(watchHistory: any[], localStorageObj: Storage = localStorage) {  
    if (!Array.isArray(watchHistory)) {
        throw new Error('watchHistory must be an array');
    }

    const prev = getWatchHistory_array();   
    const merged = [...prev, watchHistory];  // ✅ 이중 배열 유지
    console.log('merged:', merged);
    localStorageObj.setItem('watchHistory_array', JSON.stringify(merged));
}