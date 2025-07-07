import { ClusterHistory } from "@/app/types/profile";
import { getWatchHistory_array } from "../get/getWatchHistory_array";
import { getClusterHistory } from "../get/getClusterHistory";
import { getWatchHistory } from "../get/getWatchHistory";

export function saveWatchHistory_array(localStorageObj: Storage = localStorage) {   
    const clusterHistory = getClusterHistory();
    const watchHistory = getWatchHistory();

    if (!Array.isArray(watchHistory)) {
        throw new Error('watchHistory must be an array');
    }

    const newWatchHistory_array = {
        watchHistory: watchHistory,
        timestamp: new Date().toISOString().slice(0, 10),
        clusterHistory_id: clusterHistory[clusterHistory.length - 1].id,   
    }

    const prev = getWatchHistory_array();   
    const merged = [...prev, newWatchHistory_array];  // ✅ 이중 배열 유지
    console.log('merged:', merged);
    localStorageObj.setItem('watchHistory_array', JSON.stringify(merged));

    return {
        success: true,
        result: merged,
    }
}